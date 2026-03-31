import React, { useEffect, useState } from "react";
import { codapInterface } from "@concord-consortium/codap-plugin-api";
import { ExampleProps } from "./types";

type Lang = "en" | "es";

const labels: Record<Lang, { next: string; prev: string; done: string; progress: string }> = {
  en: { next: "Next", prev: "Back", done: "Got it!", progress: "{{current}} of {{total}}" },
  es: { next: "Siguiente", prev: "Atrás", done: "Entendido", progress: "{{current}} de {{total}}" }
};

const tourContent: Record<Lang, { tourKey: string; title: string; description: string }[]> = {
  en: [
    { tourKey: "toolShelf.table", title: "Tables", description: "Click here to create a data table." },
    { tourKey: "toolShelf.graph", title: "Graphs", description: "Click here to create a graph." },
    { tourKey: "toolShelf.map", title: "Maps", description: "Click here to create a map." }
  ],
  es: [
    { tourKey: "toolShelf.table", title: "Tablas", description: "Haz clic aquí para crear una tabla de datos." },
    { tourKey: "toolShelf.graph", title: "Gráficos", description: "Haz clic aquí para crear un gráfico." },
    { tourKey: "toolShelf.map", title: "Mapas", description: "Haz clic aquí para crear un mapa." }
  ]
};

export const Example5LocalizedTour: React.FC<ExampleProps> = ({ addNotification, setNotificationHandler }) => {
  const [lang, setLang] = useState<Lang>("en");
  const [tourId, setTourId] = useState<string | null>(null);
  const [stepInfo, setStepInfo] = useState("");

  useEffect(() => {
    setNotificationHandler((notice: any) => {
      if (notice.values?.operation === "tourUpdate") {
        const v = notice.values;
        addNotification(`tourUpdate: ${v.type} step=${v.stepIndex}`);
        if (v.type === "stepStarted") {
          setStepInfo(`${v.stepIndex + 1} / ${v.totalSteps}`);
        } else if (v.type === "completed") {
          setTourId(null);
          setStepInfo(lang === "es" ? "¡Tour completado!" : "Tour completed!");
        } else if (v.type === "cancelled") {
          setTourId(null);
          setStepInfo(lang === "es" ? "Tour cancelado." : "Tour cancelled.");
        }
      }
    });
    return () => setNotificationHandler(null);
  }, [addNotification, setNotificationHandler, lang]);

  const handleStartTour = async () => {
    const l = labels[lang];
    const content = tourContent[lang];

    const result = await codapInterface.sendRequest({
      action: "notify", resource: "interactiveFrame",
      values: {
        request: "startTour",
        nextBtnText: l.next,
        prevBtnText: l.prev,
        doneBtnText: l.done,
        progressText: l.progress,
        showProgress: true,
        steps: content.map(item => ({
          tourKey: item.tourKey,
          popover: { title: item.title, description: item.description }
        }))
      }
    }) as any;

    if (result?.success) {
      setTourId(result.values.tourId);
      setStepInfo("...");
      addNotification(`Localized tour started (${lang}): ${result.values.tourId}`);
    }
  };

  const handleEndTour = () => {
    codapInterface.sendRequest({
      action: "notify", resource: "interactiveFrame",
      values: { request: "endTour", tourId }
    });
    setTourId(null);
    setStepInfo("");
  };

  return (
    <div>
      <h2>Example 5: Localized Tour</h2>
      <p>
        Provides tour text in the student&apos;s language using label customization options.
      </p>
      <div className="language-selector">
        <label>Language:</label>
        <select value={lang} onChange={e => setLang(e.target.value as Lang)} disabled={!!tourId}>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
      <div className="button-row">
        <button className="primary" onClick={handleStartTour} disabled={!!tourId}>
          Start Tour
        </button>
        {tourId && <button className="danger" onClick={handleEndTour}>End Tour</button>}
      </div>
      {stepInfo && <div className="status">{stepInfo}</div>}
    </div>
  );
};
