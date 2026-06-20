// Server component: blocking inline script that sets data-theme before paint (no FOUC).
export function ThemeScript() {
  const js = `(function(){try{var t=localStorage.theme;if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
