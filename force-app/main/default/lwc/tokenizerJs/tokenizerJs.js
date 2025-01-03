export function INTEGER(a) {
    this.id = 5;
    this.value = parseInt(a, 10)
}

export function LPAREN() {
    this.id = 0
}

export function RPAREN() {
this.id = 1
}
export function AND() {
this.id = 2;
this.operation = "AND"
}

export function OR(){
this.id = 3;
this.operation = "OR"
}

export function NOT() {
this.id = 4;
this.operation = "NOT"
}

export function TokenParsingException() {
this.message = "Error: Check the spelling in your filter logic.";
}

export function ParenMismatchException() {
this.message = "Error: Check the spelling in your filter logic.";
}

export function TooManyValuesException() {
this.message = "Error: Check the spelling in your filter logic.";
}

export function UnexpectedTokenException() {
this.message = "Error: Check the spelling in your filter logic.";
}

export function EmptyInputException() {
this.message = "Error: You must enter a value.";
}

export function MissingOperandException(a) {
this.message = "Error: Check the spelling in your filter logic.";
}

export function EndOfTokensException() {
this.message = "Error: Check the spelling in your filter logic.";
}

export function Parser(a) {
this.input = a
}

export function Node(a, b, c) {
this.left = a;
this.op = b;
this.right = c
}

export function ParserNode(value) {
this.value = value;
this.right = null;
this.left = null;
this.right == null && this.left == null;
}