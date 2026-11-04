import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { debounce } from 'radash';
import { FloatingWindow, PluginApi } from 'bigbluebutton-html-plugin-sdk';
import ReactionWindow from '../window/component';

interface ReactionStackProps {
  pluginApi: PluginApi;
}

function ReactionStack({
  pluginApi,
}: ReactionStackProps): React.ReactNode {
  React.useEffect(() => {
    const navbar = document.getElementById('Navbar');

    const createReactionWindow = (top: number, left: number) => new FloatingWindow({
      id: `bbb-plugin-reaction-stack-${top}-${left}`,
      top,
      left,
      movable: true,
      backgroundColor: 'transparent',
      boxShadow: 'none',
      contentFunction(element) {
        // Let clicks pass through the transparent parts of the window;
        // the reaction pills themselves re-enable pointer events.
        const container = element;
        container.style.pointerEvents = 'none';
        const root = ReactDOM.createRoot(element);
        root.render(
          <ReactionWindow pluginApi={pluginApi} />,
        );
        return root;
      },
    });

    if (navbar) {
      const updateWindow = debounce({ delay: 500 }, () => {
        const navbarRect = navbar.getBoundingClientRect();
        pluginApi.setFloatingWindows([createReactionWindow(navbarRect.bottom, navbarRect.left)]);
      });
      const observer = new ResizeObserver(updateWindow);
      observer.observe(navbar);
      return () => {
        observer.disconnect();
        pluginApi.setFloatingWindows([]);
      };
    }

    pluginApi.setFloatingWindows([createReactionWindow(0, 0)]);
    return () => {
      pluginApi.setFloatingWindows([]);
    };
  }, [pluginApi]);

  return null;
}

export default ReactionStack;
