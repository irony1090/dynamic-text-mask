# dynamic-text-mask
Helps manage with the desired string format.
You can easily create your own format.

# Notice
* Typescript.
* Easy. (maybe?)
* Simple. (um... maybe?)
* Scalability.

### 
# use
To install dynamic-text-mask, use yarn
```
$ yarn add @irony0901/dynamic-text-mask
```

# Index
* [ExampleEmailMask](#ExampleEmailMask)  
* [ExampleDomainMask](#ExampleDomainMask)
* [ExampleTelMask](#ExampleTelMask) (**detailed description, Deepening**)   
 
# ExampleEmailMask
``` javascript
import { createDynamicTextMask, emailMask } from '@irony0901/dynamic-text-mask';
// const emailMask = createDynamicTextMask([
//   { mask: /\w|\-|\./ },  // Result (Property Path: variables[0])
//   '@',                   // Separator
//   { mask: /\w|\-|\./ }   // Result (Property Path: variables[1])
// ])

console.log( emailMask.parse('irony0901@github.com').variables )
// [ 'irony0901', 'github.com' ]

console.log( emailMask.parse('@github.com').variables )
// [ '', 'github.com' ]

console.log( emailMask.parse('irony0901').variables )
// [ 'irony0901', '' ]
```

# ExampleDomainMask
``` javascript
import { createDynamicTextMask, maskMaybe, domainMask } from '@irony0901/dynamic-text-mask';
// const domainMask = createDynamicTextMask([
//   { mask: /[a-z]/i },
//   '://',
//   { mask: /\w|\-|\./ },
//   maskMaybe(
//     ({remaining}) => remaining[0] === '/',
//     [
//       '/',
//       {
//         mask: /\/|\w|\-/,
//         exit: ( _, {remaining}) => remaining[0] === '?'
//       }
//     ]
//   ),
//   '?',
//   { mask: /./ }
// ])

console.log( domainMask.parse('https://github.com').variables )
// [ 'https', 'github.com', '', '' ]

console.log( domainMask.parse('https://github.com/irony1090/dynamic-text-mask?foo=bar&wow=amazing').variables )
// [ 'https', 'github.com', 'irony1090/dynamic-text-mask', 'foo=bar&wow=amazing' ]

console.log( domainMask.parse('https://github.com?foo=bar&wow=amazing').variables )
// [ 'https', 'github.com', '', 'foo=bar&wow=amazing' ]
```

# ExampleTelMask
``` javascript
import { createDynamicTextMask, maskMaybe, telMask } from '@irony0901/dynamic-text-mask'

// const telMask = createDynamicTextMask([
//   maskMaybe(                                    // International number part (May not be)
//     ({origin}) => origin.startsWith('+'),       // If '+' exists, read the following parts
//     [
//       '+',                                      // Separator
//       {                                         // Result (Property Path: variables[0])
//         mask: /\d/,                             // Only number
//         exit: (variable) => variable.length > 2 // Up to 3 characters
//       },
//       ' '                                       // Separator
//     ]
//   ),

//   {                                         // Result (Property Path: variables[1])
//     mask: /\d/,                             // Only number
//     exit: (variable) => variable.length > 2 // Up to 3 characters
//   },
//   '-',                                      // Separator
//   {                                         // Result (Property Path: variables[2])
//     mask: /\d/,                             // Only number
//     exit: (variable) => variable.length > 3 // Up to 4 characters
//   },
//   '-',                                      // Separator
//   {                                         // Result (Property Path: variables[3])
//     mask: /\d/,                             // Only number
//     exit: (variable) => variable.length > 3 // Up to 4 characters
//   }
// ])
const result = telMask.parse('010-123-5678');
const [ international, first, second, third ] = result.variables;

console.log('international is blank?', international === '')
// 'international is blank? true'  Because it didn't start with '+'

console.log('first:', first) 
// 'first: 010'

console.log('second:', second) 
// 'second: 123'

console.log('third:', third) 
// 'third: 5678'

console.log(result.frames)
// [ '010', '-', '123', '-', '5678' ]

const fullResult = telMask.parse('+82 010-1234-5678');
console.log('international:', fullResult.variables[0])
// 'international: 82'

console.log('first:', fullResult.variables[1]) 
// 'first: 010'

console.log('second:', fullResult.variables[2]) 
// 'second: 1234'

console.log('third:', fullResult.variables[3]) 
// 'third: 5678'

console.log('third:', fullResult.frames) 
// [ '+', '82', ' ', '010', '-', '1234', '-', '5678' ]

const notSeparatorResult = telMask.parse('0101234567890');
console.log( notSeparatorResult.variables )
// [ '', '010', '1234', '5678' ]

console.log( notSeparatorResult.frames )
// [ '010', '-', '1234', '-', '5678' ]

const strangeResult = telMask.parse('01-23-4567890');
console.log( strangeResult.variiables )
// [ '', '01', '01', '2345' ]

```

