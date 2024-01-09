- To DO
1. Change the file extensions:
   - Rename all `.js` files to `.ts`.
   - If a file contains JSX, rename it from `.js` to `.tsx`.

2. Update imports:
   - Modify the import statements in all files to reflect the new `.ts` or `.tsx` file extensions.

3. Install TypeScript:
   - Run `npm install --save-dev typescript` to add TypeScript as a dev dependency.

4. TypeScript configuration:
   - Initialize a TypeScript configuration file by running `npx tsc --init`.
   - Configure the `tsconfig.json` file according to the project's needs.

5. Add type annotations:
   - Add type annotations to variables, function parameters, and return types throughout the codebase.

6. Refactor the code:
   - Refactor any code that TypeScript identifies as type-unsafe or that does not adhere to strict typing.

7. Compile TypeScript:
   - Use the TypeScript compiler by running `npx tsc` to compile the `.ts` and `.tsx` files to JavaScript.
   - Ensure that the compiled JavaScript code runs correctly