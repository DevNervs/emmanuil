"use client";

import { useState } from "react";

export function BeliefsScroll({ beliefs }: { beliefs: string[][] }) {
  const [open, setOpen] = useState(0);

  return <section data-header-theme="light" className="beliefs-manuscript" id="beliefs" aria-labelledby="beliefs-heading">
    <div className="manuscript-heading">
      <p className="overline">Основи віровчення</p>
      <h2 id="beliefs-heading">У що ми віримо</h2>
      <span>{beliefs.length} положень</span>
      <a className="inline-link" href="/virovchennja/">Офіційний документ УЦХВЄ (PDF)</a>
    </div>
    <div className="manuscript-scroll">
      <span className="scroll-dowel scroll-dowel-top" aria-hidden="true" />
      <span className="scroll-dowel scroll-dowel-bottom" aria-hidden="true" />
      <div className="scroll-paper">
        <span className="manuscript-frame" aria-hidden="true"><i /><i /><i /><i /></span>
        <div className="scroll-ornament" aria-hidden="true"><span>Еммануїл</span></div>
        <div className="beliefs-accordion">
          {beliefs.map(([title, verse], index) => {
            const expanded = open === index;
            const panelId = `belief-panel-${index + 1}`;
            return <article className={`belief-entry ${expanded ? "is-open" : ""}`} key={title}>
              <button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setOpen(expanded ? -1 : index)}>
                <span className="belief-number">{String(index + 1).padStart(2, "0")}</span>
                <strong>{title}</strong>
                <span className="belief-toggle" aria-hidden="true">{expanded ? "−" : "+"}</span>
              </button>
              <div className="belief-panel" id={panelId} aria-hidden={!expanded}>
                <div><p>{verse}</p></div>
              </div>
            </article>;
          })}
        </div>
        <div className="scroll-seal" aria-hidden="true">E</div>
      </div>
    </div>
  </section>;
}
