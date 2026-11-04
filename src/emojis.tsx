import * as React from 'react';
import { DotLottie, DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useReducedMotion } from 'motion/react';

// How long the animation keeps looping before it settles on the still emoji.
const PLAY_DURATION_MS = 3000;
const notoUrl = (codePoint: string, file: string) => `https://fonts.gstatic.com/s/e/notoemoji/latest/${codePoint}/${file}`;
const lottieUrl = (codePoint: string) => notoUrl(codePoint, 'lottie.json');
// The still Noto artwork. Animation frames (e.g. the first frame of 🎉, before the
// confetti bursts) don't always read as the emoji, so the animation never freezes:
// it hands over to this image instead.
const stillUrl = (codePoint: string) => notoUrl(codePoint, 'emoji.svg');

// Remember which emojis have an animated version so each one is probed only once.
const availability = new Map<string, Promise<boolean>>();

const hasAnimation = (codePoint: string) => {
  if (!codePoint) return Promise.resolve(false);
  let probe = availability.get(codePoint);
  if (!probe) {
    probe = fetch(lottieUrl(codePoint), { cache: 'force-cache' })
      .then((response) => {
        if (response.ok) {
          // Warm the cache so the hand-over to the still image is instant.
          new Image().src = stillUrl(codePoint);
        }
        return response.ok;
      })
      .catch(() => false);
    availability.set(codePoint, probe);
  }
  return probe;
};

const layer = (visible: boolean): React.CSSProperties => ({
  gridArea: '1 / 1',
  width: '100%',
  height: '100%',
  opacity: visible ? 1 : 0,
  transition: 'opacity 200ms ease',
});

export function LottieEmoji({
  codePoint,
  fallbackEmoji,
}: {
  codePoint: string;
  fallbackEmoji: string;
}) {
  const [instance, setInstance] = React.useState<DotLottie | null>(null);
  const [animated, setAnimated] = React.useState<boolean | null>(null);
  const [playing, setPlaying] = React.useState(true);
  const [stillFailed, setStillFailed] = React.useState(false);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    let active = true;
    hasAnimation(codePoint).then((ok) => {
      if (active) setAnimated(ok);
    });
    return () => {
      active = false;
    };
  }, [codePoint]);

  // Finish the current loop instead of cutting it mid-way, then show the still.
  React.useEffect(() => {
    if (!instance) return undefined;
    const onComplete = () => setPlaying(false);
    instance.addEventListener('complete', onComplete);
    const id = setTimeout(() => instance.setLoop(false), PLAY_DURATION_MS);
    return () => {
      clearTimeout(id);
      instance.removeEventListener('complete', onComplete);
    };
  }, [instance]);

  const glyph = <span>{fallbackEmoji}</span>;

  // Show the native emoji while probing and whenever there is no animation,
  // so the badge is never empty.
  if (!animated) return glyph;

  const still = stillFailed ? glyph : (
    <img src={stillUrl(codePoint)} alt="" draggable={false} onError={() => setStillFailed(true)} />
  );

  if (reduceMotion) return still;

  const replay = () => {
    if (!instance) return;
    setPlaying(true);
    instance.setLoop(true);
    instance.play();
  };

  return (
    <span
      style={{ display: 'grid', placeItems: 'center' }}
      onMouseEnter={replay}
      onMouseLeave={() => instance?.setLoop(false)}
    >
      <span style={{ ...layer(playing), display: 'grid', placeItems: 'center' }}>
        <DotLottieReact
          src={lottieUrl(codePoint)}
          dotLottieRefCallback={setInstance}
          autoplay
          loop
          renderConfig={{ autoResize: true }}
        />
      </span>
      <span style={{ ...layer(!playing), display: 'grid', placeItems: 'center' }}>
        {still}
      </span>
    </span>
  );
}
