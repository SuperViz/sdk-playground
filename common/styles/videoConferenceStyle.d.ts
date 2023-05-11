declare const styles = "\n  html, body { \n    width: 100%;\n    height: 100%;\n    overflow: hidden;\n  }\n\n  #sv-video-wrapper iframe {\n    position: fixed;\n    \n    border: none;\n\n    margin: 0; \n    padding: 0; \n    overflow: hidden;\n    z-index: 5;\n  }\n\n  #sv-video-wrapper iframe.sv-video-frame--right { \n    top: var(--superviz-offset-top);\n    right: var(--superviz-offset-right);\n  }\n\n  #sv-video-wrapper iframe.sv-video-frame--left { \n    top: var(--superviz-offset-top);\n    left: var(--superviz-offset-left);\n  }\n\n  #sv-video-wrapper iframe.sv-video-frame--bottom { \n    bottom: var(--superviz-offset-bottom);\n    right: var(--superviz-offset-right);\n    width: 100%;\n  }\n";
export default styles;
