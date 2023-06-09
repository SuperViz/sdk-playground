const styles = `
  html, body { 
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  #sv-video-wrapper iframe {
    position: fixed;
    
    border: none;

    margin: 0; 
    padding: 0; 
    overflow: hidden;
    z-index: 5;
  }

  #sv-video-wrapper iframe.sv-video-frame--right { 
    top: var(--superviz-offset-top);
    right: var(--superviz-offset-right);
  }

  #sv-video-wrapper iframe.sv-video-frame--left { 
    top: var(--superviz-offset-top);
    left: var(--superviz-offset-left);
  }

  #sv-video-wrapper iframe.sv-video-frame--bottom { 
    bottom: var(--superviz-offset-bottom);
    width: 100%;
  }
`;

export default styles;
