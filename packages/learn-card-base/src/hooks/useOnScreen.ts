import { useState, useEffect, useRef, MutableRefObject, DependencyList } from 'react';

/* usage: 
 // Ref for the element that we want to detect whether on screen
  const ref: any = useRef<HTMLDivElement>();
  // Call the hook passing in ref and root margin
  // In this case it would only be considered onScreen if more ...
  // ... than 300px of element is visible.
  const onScreen: boolean = useOnScreen<HTMLDivElement>(ref, "-300px");

    return (
    <div>
      <div style={{ height: "100vh" }}>
        <h1>Scroll down to next section 👇</h1>
      </div>
      <div
        ref={ref}
        style={{
          height: "100vh",
          backgroundColor: onScreen ? "#23cebd" : "#efefef",
        }}
      >
        {onScreen ? (
          <div>
            <h1>Hey I'm on the screen</h1>
            <img src="https://i.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif" />
          </div>
        ) : (
          <h1>Scroll down 300px from the top of this section 👇</h1>
        )}
      </div>
    </div>
  );

  */

function useOnScreen<T extends Element>(
    ref: MutableRefObject<T>,
    rootMargin: string = '0px',
    dependencies: DependencyList = []
): boolean {
    // State and setter for storing whether element is visible
    const [isIntersecting, setIntersecting] = useState<boolean>(false);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Update our state when observer callback fires
                setIntersecting(entry.isIntersecting);
            },
            {
                rootMargin,
            }
        );
        if (ref.current) {
            observer.observe(ref.current);
        }
        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, dependencies); // Empty array ensures that effect is only run on mount and unmount
    return isIntersecting;
}

export default useOnScreen;
