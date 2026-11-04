import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { USER_REACTIONS } from '../../graphql/queries';
import { type UserReactionResponse, type UserReaction } from '../../graphql/types';
import {
  ReactionList, ReactionItem, UserName, Emoji, OverflowItem, OverflowEmojis,
} from './styles';
import { LottieEmoji } from '../../emojis';
import { useDarkTheme } from '../../use-dark-theme';

// Only reactions created after the plugin was loaded are shown.
const initialCursor = new Date().toUTCString();

// Keeps the stack from covering the presentation when many people react at once.
const MAX_VISIBLE = 6;

// How long a pill takes to fade out before its reaction expires.
const FADE_MS = 1500;

interface ReactionWindowProps {
  pluginApi: PluginApi;
}

const toCodePoint = (emoji: string) => emoji.codePointAt(0)?.toString(16) ?? '';

const timeLeft = (reaction: UserReaction) => new Date(reaction.expiresAt).getTime() - Date.now();

interface ReactionEntry extends UserReaction {
  // Fade timing, frozen when the reaction arrives so re-renders don't restart it.
  fadeDelayMs: number;
}

const toEntry = (reaction: UserReaction, remaining: number): ReactionEntry => ({
  ...reaction,
  fadeDelayMs: remaining - FADE_MS,
});

function ReactionWindow({
  pluginApi,
}: ReactionWindowProps) {
  const {
    data: userReactions,
  } = pluginApi.useCustomSubscription<UserReactionResponse>(
    USER_REACTIONS,
    { variables: { initialCursor } },
  );
  const [reactions, setReactions] = React.useState<Record<string, ReactionEntry>>({});
  const timeouts = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const reduceMotion = useReducedMotion();
  const dark = useDarkTheme();

  React.useEffect(() => {
    if (!userReactions?.user_reaction_stream?.length) return;

    const removeReaction = (userId: string) => {
      timeouts.current.delete(userId);
      setReactions((prev) => {
        if (!prev[userId]) return prev;
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    setReactions((prev) => {
      const next = { ...prev };
      userReactions.user_reaction_stream.forEach((reaction) => {
        const { userId } = reaction;
        const pending = timeouts.current.get(userId);
        if (pending) {
          clearTimeout(pending);
          timeouts.current.delete(userId);
        }

        const remaining = timeLeft(reaction);
        if (reaction.reactionEmoji === 'none' || remaining <= 0) {
          delete next[userId];
          return;
        }

        next[userId] = toEntry(reaction, remaining);
        timeouts.current.set(userId, setTimeout(() => removeReaction(userId), remaining));
      });
      return next;
    });
  }, [userReactions]);

  React.useEffect(() => {
    const pending = timeouts.current;
    return () => {
      pending.forEach((id) => clearTimeout(id));
      pending.clear();
    };
  }, []);

  const sorted = Object.values(reactions)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const visible = sorted.slice(0, MAX_VISIBLE);
  const hidden = sorted.slice(MAX_VISIBLE);

  const transition = reduceMotion
    ? { duration: 0.15 }
    : {
      type: 'spring' as const, stiffness: 520, damping: 34, mass: 0.8,
    };

  return (
    <ReactionList $dark={dark} aria-live="polite" aria-label="Reactions">
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((reaction) => (
          <ReactionItem
            key={`${reaction.userId}-${reaction.createdAt}`}
            title={`${reaction.user?.name} ${reaction.reactionEmoji}`}
            layout="position"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -16, scale: 0.92 }}
            transition={transition}
            style={{
              '--rs-fade-duration': `${FADE_MS}ms`,
              '--rs-fade-delay': `${reaction.fadeDelayMs}ms`,
              '--rs-user': reaction.user?.color,
            } as React.CSSProperties}
          >
            <Emoji aria-hidden>
              <LottieEmoji
                codePoint={toCodePoint(reaction.reactionEmoji)}
                fallbackEmoji={reaction.reactionEmoji}
              />
            </Emoji>
            <UserName>{reaction.user?.name}</UserName>
          </ReactionItem>
        ))}
        {hidden.length > 0 && (
          <OverflowItem
            key="overflow"
            layout="position"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={transition}
            title={hidden.map((r) => `${r.user?.name} ${r.reactionEmoji}`).join('\n')}
          >
            <OverflowEmojis aria-hidden>
              {Array.from(new Set(hidden.map((r) => r.reactionEmoji))).slice(0, 3).join('')}
            </OverflowEmojis>
            {`+${hidden.length}`}
          </OverflowItem>
        )}
      </AnimatePresence>
    </ReactionList>
  );
}

export default ReactionWindow;
