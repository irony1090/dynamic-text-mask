type MaskPredictParam = {
  origin: string;
  variables: Array<string>;
  remaining: Array<string>;
  frames: Array<string>;
}

// export type MaskDynamicVal = {
  
// }
// const d = {
//   mask: /[a-z]\w{1,9}/,
//   filter: ({variable}) => variable.length > 
// }
export type MaskVal = {
  charactorMask: RegExp;
  length: number | ( (maskParam: MaskPredictParam) => number );
  emptyChar?: string | ( (maskParam: MaskPredictParam) => string);
}

export type MaskMayBeParam = {
  flag: (maskParam: MaskPredictParam) => boolean;
  elements: Array<string | MaskVal>;
}
export type MaskMayBe = (
  flag: (maskParam: MaskPredictParam) => boolean,
  elements: Array<string | MaskVal>
) => MaskMayBeParam 

export const maskMayBe: MaskMayBe = (
  flag, elements
): MaskMayBeParam => {

  return { flag, elements };
}

type ReduceResult =  MaskPredictParam & {
  remaining: Array<string>;
  flag: boolean;
  flatIndex: number;
}

export type MaskElement = string | MaskVal | MaskMayBeParam;

export class DynamicTextMask {
  private format_: Array<MaskElement>;

  // private vals: Array<MaskVal>;
  private flats: Array<string|MaskVal>;

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

    const { flats, vals } = format.reduce( predictReduceVariables, {vals: [], flats: []})
    // this.vals = vals;
    this.flats = flats;
  }

  parse(input: string): MaskPredictParam {
    const predict = (rst: ReduceResult, element: MaskElement ): ReduceResult => {
      // if( rst.remaining.length === 0)
      //   return rst;

      if( element instanceof Object){
        if( 'charactorMask' in element ){
          rst.flatIndex++;  // 위치 특정을 위해
          const {emptyChar: unclear, charactorMask} = element;
          const emptyChar = parseEmptyChar(unclear, rst);
          const length = parseLength(element.length, rst);
          const variable: Array<string> = [];
          let count = 0;
          let emptyCount = 0;
          if( rst.flag ){
            while( count < length ){
              const char = rst.remaining[0];
              if( rst.remaining.length === 0 ){
                variable.push(emptyChar[emptyCount%emptyChar.length]);
                emptyCount++;
                count++;
              } else if( charactorMask.test(char) ){
                // console.log('[test]', char);
                variable.push(char);
                count++;
              } else if ( isCharContains(this.flats.slice(rst.flatIndex+1), rst.remaining) ){
                // console.log('[contains]', char);
                variable.push(emptyChar[emptyCount%emptyChar.length]);
                emptyCount++;
                count++;
                continue;
              }

              rst.remaining.splice(0, 1);
              
            }
            rst.frames.push( variable.join('') )
            rst.variables.push( variable.join('') )
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

const isCharContains = (elements: Array<string| MaskVal>, remaining: Array<string>): boolean => 
  elements.some( (element) => {
    if( element instanceof Object )
      return element.charactorMask.test(remaining[0]);
    else
      return element.length > 1 
        ? element === remaining.slice(0, element.length).join('')
        : element === remaining[0]
  })


const predictReduceVariables = (rst: { vals: Array<MaskVal>, flats: Array<string|MaskVal> }, element: MaskElement): { vals: Array<MaskVal>, flats: Array<string|MaskVal> } => {
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

const parseLength = (funcOrNumber: number | ( (maskParam: MaskPredictParam) => number ), param: MaskPredictParam): number => {
  return typeof funcOrNumber === 'function'
    ? funcOrNumber(param)
    : funcOrNumber;
}
const parseEmptyChar = (funcOrString: string | ( (maskParam: MaskPredictParam) => string ), param: MaskPredictParam): string => {
  return typeof funcOrString === 'function'
    ? funcOrString(param)
    : (funcOrString||'');
}


export const createDynamicTextMask = (format: Array<MaskElement>) => new DynamicTextMask(format);

export const telMask = new DynamicTextMask([
  maskMayBe(
    ({origin}) => origin.startsWith('+'),
    [
      '+',
      {
        charactorMask: /\d/,
        length: 3
      },
      ' '
    ]
  ),
  {
    charactorMask: /\d/,
    length: 3
  },
  '-',
  {
    charactorMask: /\d/,
    length: 4
  },
  '-',
  {
    charactorMask: /\d/,
    length: 4
  }
])