import { useEffect, useState } from "react";

// TEMPORARY layout diagnostic. Shows the real viewport metrics + the resolved
// safe-area-inset-bottom, and outlines each layout layer in a distinct colour:
//   body = red · #root = green · app-shell = blue · app-content = magenta ·
//   bottom-nav = yellow
// so we can see EXACTLY which element leaves the strip at the bottom.
// Remove this component (and the .debug-layout block in index.css) once solved.
export default function DebugViewport() {
  const [info, setInfo] = useState<Record<string, number>>({});

  useEffect(() => {
    document.documentElement.classList.add("debug-layout");

    // Probe the resolved env(safe-area-inset-bottom): an off-screen element
    // whose height IS the inset, then measure it.
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;bottom:0;left:0;width:0;height:env(safe-area-inset-bottom,0px);pointer-events:none;";
    document.body.appendChild(probe);

    const probeTop = document.createElement("div");
    probeTop.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);pointer-events:none;";
    document.body.appendChild(probeTop);

    const measure = () => {
      setInfo({
        "window.innerHeight": Math.round(window.innerHeight),
        "visualViewport.height": Math.round(window.visualViewport?.height ?? 0),
        "documentElement.clientHeight": document.documentElement.clientHeight,
        "screen.height": window.screen.height,
        "safe-area-inset-bottom": Math.round(probe.getBoundingClientRect().height),
        "safe-area-inset-top": Math.round(probeTop.getBoundingClientRect().height),
        "navBottomGap": Math.round(
          window.innerHeight -
            (document.querySelector(".bottom-nav")?.getBoundingClientRect()
              .bottom ?? 0),
        ),
      });
    };
    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      document.documentElement.classList.remove("debug-layout");
      probe.remove();
      probeTop.remove();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      dir="ltr"
      style={{
        position: "fixed",
        bottom: "calc(var(--nav-h) + env(safe-area-inset-bottom, 0px) + 8px)",
        left: 8,
        zIndex: 9999,
        background: "rgba(0,0,0,0.82)",
        color: "#0f0",
        font: "11px/1.35 monospace",
        padding: "8px 10px",
        borderRadius: 8,
        border: "1px solid #0f0",
        pointerEvents: "none",
        maxWidth: "70vw",
      }}
    >
      {Object.entries(info).map(([k, v]) => (
        <div key={k}>
          {k}: <b style={{ color: "#fff" }}>{v}px</b>
        </div>
      ))}
    </div>
  );
}
