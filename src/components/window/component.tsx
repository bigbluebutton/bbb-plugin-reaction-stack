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

// Reactions live as long as the server says (30s by default). The exit animation
// starts this much earlier so the pill is fully gone by the time the reaction expires.
const EXIT_MS = 300;

// Stable class names a theme plugin can target (see README).
const CLASS = {
  list: 'bbb-reaction-stack',
  item: 'bbb-reaction-stack__item',
  emoji: 'bbb-reaction-stack__emoji',
  name: 'bbb-reaction-stack__name',
  overflow: 'bbb-reaction-stack__overflow',
};

interface ReactionWindowProps {
  pluginApi: PluginApi;
}

const toCodePoint = (emoji: string) => emoji.codePointAt(0)?.toString(16) ?? '';

const timeLeft = (reaction: UserReaction) => new Date(reaction.expiresAt).getTime() - Date.now();

function ReactionWindow({
  pluginApi,
}: ReactionWindowProps) {
  const {
    data: userReactions,
  } = pluginApi.useCustomSubscription<UserReactionResponse>(
    USER_REACTIONS,
    { variables: { initialCursor } },
  );
  const [reactions, setReactions] = React.useState<Record<string, UserReaction>>({});
  const timers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const reduceMotion = useReducedMotion();
  const dark = useDarkTheme();

  React.useEffect(() => {
    if (!userReactions?.user_reaction_stream?.length) return;

    const removeReaction = (userId: string) => {
      timers.current.delete(userId);
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
        clearTimeout(timers.current.get(userId));
        timers.current.delete(userId);

        const remaining = timeLeft(reaction);
        if (reaction.reactionEmoji === 'none' || remaining <= 0) {
          delete next[userId];
          return;
        }

        next[userId] = reaction;
        timers.current.set(
          userId,
          setTimeout(() => removeReaction(userId), Math.max(remaining - EXIT_MS, 0)),
        );
      });
      return next;
    });
  }, [userReactions]);

  React.useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => clearTimeout(id));
      pending.clear();
    };
  }, []);

  const sorted = Object.values(reactions)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const visible = sorted.slice(0, MAX_VISIBLE);
  const hidden = sorted.slice(MAX_VISIBLE);

  const spring = reduceMotion
    ? { duration: 0.15 }
    : {
      type: 'spring' as const, stiffness: 520, damping: 34, mass: 0.8,
    };

  return (
    <ReactionList className={CLASS.list} $dark={dark} aria-live="polite" aria-label="Reactions">
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((reaction) => (
          <ReactionItem
            key={`${reaction.userId}-${reaction.createdAt}`}
            className={CLASS.item}
            title={`${reaction.user?.name} ${reaction.reactionEmoji}`}
            layout="position"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduceMotion
              ? { opacity: 0, transition: { duration: 0.15 } }
              : {
                opacity: 0, x: -32, scale: 0.95, transition: { duration: EXIT_MS / 1000, ease: 'easeIn' },
              }}
            transition={spring}
            style={{ '--rs-user': reaction.user?.color } as React.CSSProperties}
          >
            <Emoji className={CLASS.emoji} aria-hidden>
              <LottieEmoji
                codePoint={toCodePoint(reaction.reactionEmoji)}
                fallbackEmoji={reaction.reactionEmoji}
              />
            </Emoji>
            <UserName className={CLASS.name}>{reaction.user?.name}</UserName>
          </ReactionItem>
        ))}
        {hidden.length > 0 && (
          <OverflowItem
            key="overflow"
            className={CLASS.overflow}
            layout="position"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={spring}
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
