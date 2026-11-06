import styled from 'styled-components';
import { motion } from 'motion/react';

/*
 * Colors come from the BigBlueButton palette CSS variables (with the stock
 * values as fallbacks), so the stack looks native in the default theme and
 * follows any theme that overrides those variables.
 */
const lightTokens = `
  --rs-surface: var(--color-white, #FFF);
  --rs-text: var(--color-gray-dark, #06172A);
  --rs-muted: var(--color-gray, #4E5A66);
  --rs-border: var(--color-gray-lightest, #D4D9DF);
  --rs-shadow: 0 1px 2px rgba(6, 23, 42, 0.08), 0 2px 8px rgba(6, 23, 42, 0.12);
  --rs-tint: 16%;
  --rs-tint-fallback: rgba(6, 23, 42, 0.06);
`;

// Mirrors the values BBB itself uses when its dark theme is on.
const darkTokens = `
  --rs-surface: var(--color-overlays-dark-theme, #2D2F38);
  --rs-text: var(--color-text-dark-theme, #FFF);
  --rs-muted: rgba(255, 255, 255, 0.7);
  --rs-border: rgba(255, 255, 255, 0.08);
  --rs-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 2px 10px rgba(0, 0, 0, 0.35);
  --rs-tint: 30%;
  --rs-tint-fallback: rgba(255, 255, 255, 0.08);
`;

export const ReactionList = styled.ul<{ $dark: boolean }>`
  ${({ $dark }) => ($dark ? darkTokens : lightTokens)}

  list-style: none;
  padding: 0.5rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.375rem;
  font-family: inherit;
  user-select: none;
  /* Never block the presentation/webcams behind the empty parts of the stack. */
  pointer-events: none;

  &:empty {
    padding: 0;
  }

  & > li {
    pointer-events: auto;
  }
`;

const pill = `
  position: relative;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  /* Themes can override the shape, e.g. :root { --reaction-stack-radius: 0.5rem; } */
  border-radius: var(--reaction-stack-radius, 1.7rem);
  overflow: hidden;
  background-color: var(--rs-surface);
  border: 1px solid var(--rs-border);
  box-shadow: var(--rs-shadow);
  color: var(--rs-text);
`;

export const ReactionItem = styled(motion.li)`
  ${pill}

  gap: 0.5rem;
  height: 2.5rem;
  /* Each pill hugs its name; very long names are capped and ellipsized. */
  max-width: 16rem;
  padding: 0 1rem 0 0.25rem;
  @media (max-width: 768px) {
    height: 2rem;
    max-width: 12rem;
    padding-inline-end: 0.75rem;
    gap: 0.375rem;
  }
`;

// The emoji sits on a soft disc tinted with the user's color (same color as their avatar).
export const Emoji = styled.span`
  flex: none;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--reaction-stack-emoji-radius, 50%);
  background: var(--rs-tint-fallback);
  background: color-mix(in srgb, var(--rs-user, transparent) var(--rs-tint), transparent);
  font-size: 1.25rem;
  line-height: 1;

  /* The Lottie wrapper sets an inline 100% size. */
  & > * {
    width: 1.5rem !important;
    height: 1.5rem !important;
    display: grid;
    place-items: center;
  }

  & canvas,
  & img {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }

  @media (max-width: 768px) {
    width: 1.625rem;
    height: 1.625rem;
    font-size: 1rem;

    & > * {
      width: 1.25rem !important;
      height: 1.25rem !important;
    }
  }
`;

export const UserName = styled.span`
  min-width: 0;
  color: var(--rs-text);
  font-size: 0.875rem;
  font-weight: 600;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

export const OverflowItem = styled(motion.li)`
  ${pill}

  gap: 0.25rem;
  height: 1.75rem;
  padding: 0 0.625rem 0 0.5rem;
  color: var(--rs-muted);
  font-size: 0.75rem;
  font-weight: 600;
`;

export const OverflowEmojis = styled.span`
  font-size: 0.875rem;
  letter-spacing: -0.15em;
  margin-inline-end: 0.25rem;
`;
