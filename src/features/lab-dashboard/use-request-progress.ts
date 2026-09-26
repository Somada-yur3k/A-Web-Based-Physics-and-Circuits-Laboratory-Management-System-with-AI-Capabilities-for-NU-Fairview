import { useEffect, type RefObject } from "react";

// Keep the current step visible when a phone rotates or the available content width changes.
export default function useRequestProgress(activeStep: RefObject<HTMLLIElement | null>, step: string | number) {
  useEffect(() => {
    const current = activeStep.current;
    const nav = current?.closest<HTMLElement>(".request-progress");
    if (!current || !nav) return;
    function align() {
      const itemBounds = current!.getBoundingClientRect(), navBounds = nav!.getBoundingClientRect();
      nav!.scrollLeft += itemBounds.left + itemBounds.width / 2 - navBounds.left - navBounds.width / 2;
    }
    const observer = new ResizeObserver(align);
    observer.observe(nav);
    align();
    return () => observer.disconnect();
  }, [activeStep, step]);
}
