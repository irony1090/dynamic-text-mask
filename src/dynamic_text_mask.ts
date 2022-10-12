type MaskPredictParam = {
  origin: string;
  variables: Array<string>;
  remaining: Array<string>;
  frames: Array<string>;
}

// export type MaskDynamicVal = {
  
// }
// const els = [
//   bind([
//     /[a-z]/,
//     { mask: /\[a-z]|-|\d/, min: 1 },
//     { mask: /\w/, min: 1 },
//   ]),
// ]
export type MaskVariable = {
  mask: RegExp;
  // length: number | ( (maskParam: MaskPredictParam) => number );
  // min?: number | ( (maskParam: MaskPredictParam) => number );
  // exit?: (variable: string, maskParam: MaskPredictParam) => boolean;
  exit?: (variable: string, maskParam: MaskPredictParam) => boolean;
  // postExit?: (variable: string, maskParam: MaskPredictParam) => boolean;
  resultModifier?: (variable: string, maskParam: MaskPredictParam) => string;
  // emptyChar?: string | ( (maskParam: MaskPredictParam) => string);
}

export type MaskMaybeParam = {
  flag: (maskParam: MaskPredictParam) => boolean;
  elements: Array<string | MaskVariable>;
}
export type MaskMaybe = (
  flag: (maskParam: MaskPredictParam) => boolean,
  elements: Array<string | MaskVariable>
) => MaskMaybeParam 

export const maskMaybe: MaskMaybe = (
  flag, elements
): MaskMaybeParam => {

  return { flag, elements };
}

type ReduceResult =  MaskPredictParam & {
  remaining: Array<string>;
  flag: boolean;
  flatIndex: number;
}
export type MaskFilter = string | MaskVariable;
export type MaskElement =  MaskFilter | MaskMaybeParam;

export class DynamicTextMask {
  private format_: Array<MaskElement>;

  // private vals: Array<MaskVal>;
  private flats: Array<MaskFilter>;

  constructor( format: Array<MaskElement> ){
    this.format = format;
  }

  get format(): Array<MaskElement> {
    return this.format_;
  }
  set format(format: Array<MaskElement>) {
    if( !this.format_ )
      this.format_ = format;
    else 
      throw new Error('Format not modifiable');

    const { flats } = format.reduce( predictReduceVariables, {vals: [], flats: []})
    // this.vals = vals;
    this.flats = flats;
  }

  parse(input: string): MaskPredictParam {
    const predict = (rst: ReduceResult, element: MaskElement ): ReduceResult => {
      // if( rst.remaining.length === 0)
      //   return rst;

      if( element instanceof Object){
        if( 'mask' in element ){
          rst.flatIndex++;  // 위치 특정을 위해
          const { mask, exit, resultModifier } = element;
          let variable: string = '';
          
          if( rst.flag ){
            // let exit: boolean = rst.remaining.length > 0;
            [...rst.remaining].some( char => {
              const isExit = exit?.(variable, rst);
              if( isExit )
                return true;
              const test = mask.test(char);
              if( test )
                variable += char;
              else if( isCharContains(this.flats.slice(rst.flatIndex+1), rst.remaining) )
                return true;
              // const isExit: boolean = exit?.(variable, rst);
              rst.remaining.splice(0, 1);
              
              return false;
            })
            const modifiedVariable = resultModifier?.(variable, rst);
            variable = modifiedVariable !== undefined ? modifiedVariable : variable;

            rst.frames.push( variable )
            rst.variables.push( variable )
          }else
            rst.variables.push('');
            // rst.frames.push('')
          
          
          
        }else if( 'flag' in element ){
          const proxy = element.elements.reduce(predict, {...rst, flag: element.flag(rst)});
          proxy.flag = true;
          return proxy;
        }
        
      }else{
        rst.flatIndex++;  // 위치 특정을 위해

        if( rst.flag ){
          rst.frames.push(element);
          if( rst.remaining.slice(0, element.length).join('') === element )
            rst.remaining.splice(0, element.length);
        }

      }
      return rst;
    }

    const result =  this.format_.reduce( predict , {
      origin: input,
      remaining: input.split(''),
      variables: [],
      frames: [],
      flatIndex: -1,
      flag: true
    })

    return {
      origin: input,
      remaining: result.remaining,
      variables:result.variables,
      frames: result.frames
    }
  }
}

const isCharContains = (elements: Array<MaskFilter>, remaining: Array<string>): boolean => 
  elements.some( (element) => {
    if( element instanceof Object )
      return element.mask.test(remaining[0]);
    else
      return element.length > 1 
        ? element === remaining.slice(0, element.length).join('')
        : element === remaining[0]
  })


const predictReduceVariables = (rst: { vals: Array<MaskVariable>, flats: Array<MaskFilter> }, element: MaskElement): { vals: Array<MaskVariable>, flats: Array<MaskFilter> } => {
  if( element instanceof Object ){
    if( 'mask' in element ){
      rst.vals.push(element);
      rst.flats.push(element);
    }
    else if( 'flag' in element )
      return element.elements.reduce( predictReduceVariables, rst)
  }else
    rst.flats.push(element);
  return rst;
}

// const parseLength = (funcOrNumber: number | ( (maskParam: MaskPredictParam) => number ), param: MaskPredictParam): number => {
//   return typeof funcOrNumber === 'function'
//     ? funcOrNumber(param)
//     : funcOrNumber;
// }
// const parseEmptyChar = (funcOrString: string | ( (maskParam: MaskPredictParam) => string ), param: MaskPredictParam): string => {
//   return typeof funcOrString === 'function'
//     ? funcOrString(param)
//     : (funcOrString||'');
// }


export const createDynamicTextMask = (format: Array<MaskElement>) => new DynamicTextMask(format);

export const telMask = createDynamicTextMask([
  maskMaybe(
    ({origin}) => origin.startsWith('+'),
    [
      '+',
      {
        mask: /\d/,
        exit: (variable) => variable.length > 2
      },
      ' '
    ]
  ),
  {
    mask: /\d/,
    exit: (variable) => variable.length > 2,
    // resultModifier: (variable, {variables}) => {
    //   if( variables[0].length > 0 )
    //     return variable.startsWith('0') ? variable.slice(1) : undefined
    //   else
    //     return undefined;
    // }
  },
  '-',
  {
    mask: /\d/,
    exit: (variable) => variable.length > 3
  },
  '-',
  {
    mask: /\d/,
    exit: (variable) => variable.length > 3
  }
])

export const emailMask = createDynamicTextMask([
  { mask: /\w|\-|\./ },
  '@',
  { mask: /\w|\-|\./ }
])

export const domainMask = createDynamicTextMask([
  { mask: /[a-z]/i },
  '://',
  { mask: /\w|\-|\./ },
  maskMaybe(
    ({remaining}) => remaining[0] === '/',
    [
      '/',
      {
        mask: /\/|\w|\-/,
        exit: ( _, {remaining}) => remaining[0] === '?'
      }
    ]
  ),
  '?',
  { mask: /./ }
])