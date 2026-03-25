declare module 'smiles-drawer' {
  interface DrawerOptions {
    width?: number;
    height?: number;
    bondThickness?: number;
    shortBondWidth?: number;
    bondSpacing?: number;
    atomVisualization?: string;
    isomeric?: boolean;
    fontSizeLarge?: number;
    fontSizeSmall?: number;
    [key: string]: unknown;
  }

  class Drawer {
    constructor(options?: DrawerOptions);
    draw(tree: unknown, canvas: HTMLCanvasElement, theme?: string, debug?: boolean): void;
  }

  function parse(
    smiles: string,
    successCallback: (tree: unknown) => void,
    errorCallback?: (err: Error) => void,
  ): void;

  const _default: {
    Drawer: typeof Drawer;
    parse: typeof parse;
    [key: string]: unknown;
  };
  export default _default;
}
