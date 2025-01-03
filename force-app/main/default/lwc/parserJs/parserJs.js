import  {ParserNode,INTEGER,LPAREN,RPAREN,AND,OR,NOT,Node,TooManyValuesException,MissingOperandException,TokenParsingException,EndOfTokensException,ParenMismatchException} from 'c/tokenizerJs';

export default class ParserJs {

    constructor() {
        this.input = 0;
    }
    /**
     * getTokens breaks down the filter logic string into tokens
     * Example String: '1 AND 2 OR 3'
     * Output: [{"id":5,"value":1},{"id":2,"operation":"AND"},{"id":5,"value":2},{"id":3,"operation":"OR"},{"id":5,"value":3}]
     */
    getTokens(input) {
        var a = [], b = /\d+/g, c = input.match(/\s+|\w+|\d+|\(|\)|\W+/g);
        if (!c)
            throw new MissingOperandException;
        for (var e = 0; e < c.length; e++) {
            var d = c[e].trim(), f = d.match(b);
            if ("(" === d)
                a.push(new LPAREN);
            else if (")" === d)
                a.push(new RPAREN);
            else if ("AND" === d.toUpperCase())
                a.push(new AND);
            else if ("OR" === d.toUpperCase())
                a.push(new OR);
            else if ("NOT" === d.toUpperCase())
                a.push(new NOT);
            else if (f && 1 == f.length && f[0] === d)
                a.push(new INTEGER(d));
            else if (!(d.match(/\s+/i) || "" === d))
                throw new TokenParsingException;
        }
        return a
    }

    /**
     * getFilterNumbers returns the filter number used in filter logic
     * Example: 1 AND 2 OR 3
     * Output: 1 2 3
     */
    getFilterNumbers(input) {
        for (var a = this.getTree(input), b = {}; a instanceof Node; )
            null !== a.left && (b[a.left] = 0),
            a = a.right;
        !(a instanceof Node) && null !== a && (b[a] = 0);
        return b
    }
    /**
     * getFiltersInUseMessage checks that the filter logic is valid or not. In case of valid logic null is returned
     * For invalid logic error message is returned
     */
    getFiltersInUseMessage(a, input) {
        for (var b = this.getFilterNumbers(input), c = [], e = [], d = 0; d < a.length; d++) {
            "undefined" === typeof b[a[d]] ? c.push(a[d]) : b[a[d]]++;
        }
        for (var f in b)
            b[f] || e.push(f);
        return 0 < c.length ? "Error: Filter conditions " + c.join(",") + " are defined but not referenced in your filter logic." : 0 < e.length ? "Error: The filter logic references an undefined filter: " + e.join(",") : null
    }
    getTree(input) {
        /*if (!this.allowEmpty && (!this.input || Ext.isEmpty(this.input.replace(/\s+/i, ""))))
         throw new Sfdc.reports.filter.booleanfilter.tokenizer.EmptyInputException;*/
        var a = this.getTokens(input), b = [];
        this.index = 0;
        a = this._exp(a, b);
        if (0 < b.length)
            throw new TooManyValuesException;
        return a
    }
    _exp(a, b) {
        if (this.index >= a.length)
            throw new EndOfTokensException;
        for (; this.index < a.length; ) {
            var c = a[this.index];
            this.index++;
            switch (c.id) {
                case 5:
                    b.push(c.value);
                    break;
                case 0:
                    b.push("(");
                    break;
                case 1:
                    if (2 > b.length)
                        throw new ParenMismatchException;
                    c = b.pop();
                    if ("(" !== b.pop())
                        throw new ParenMismatchException;
                    b.push(c);
                    break;
                case 4:
                    b.push(new Node(null, c.operation, this._exp(a, b)));
                    break;
                case 2:
                case 3:
                    if (0 === b.length)
                        throw new MissingOperandException(c.operation);
                    var e = b.pop();
                    if ("number" !== typeof e)
                        throw new MissingOperandException(c.operation);
                    b.push(new Node(e, c.operation, this._exp(a, b)));
                    break;
                default:
                    throw new UnexpectedTokenException;
            }
        }
        c = b.pop();
        if ("(" === c)
            throw new ParenMismatchException(this.index);
        return c
    }

    infixToPostfix(expression) {
        const prec = {"OR": 3, "AND": 2, "(": 1};
        var op_stack = [];
        var postfixList = [];
        var tokens = this.getTokens(expression);
        var postFixStr = [];
        tokens.forEach((element, index) => {
            if (element.id == 0)
            {
                postFixStr.push('(');
            } else if (element.id == 1)
            {
                postFixStr.push(')');
            } else if (element.id == 2)
            {
                postFixStr.push('AND');
            } else if (element.id == 3)
            {
                postFixStr.push('OR');
            } else if (element.id == 5)
            {
                postFixStr.push(element.value);
            }

        });

        for (const token of postFixStr) {
            if ("123456789".indexOf(token) !== -1) {
                postfixList.push(token);
            } else if ("(" === token) {
                op_stack.push(token);
            } else if (")" === token) {
                var top_op_token = op_stack.pop();
                while (top_op_token !== '(') {
                    postfixList.push(top_op_token);
                    top_op_token = op_stack.pop();
                }
            } else {
                var peek_elem = op_stack.slice(-1)[0];
                while (op_stack.length > 0 && (prec[peek_elem] >= prec[token])) {
                    postfixList.push(op_stack.pop());
                    peek_elem = op_stack.slice(-1)[0];
                }
                op_stack.push(token);
            }
        }
        while (op_stack.length > 0) {
            postfixList.push(op_stack.pop());
        }

        return postfixList;
    }

    // Node(value) {
    //     this.value = value;
    //     this.right = null;
    //     this.left = null;
    //     this.right == null && this.left == null;
    // }

    /**
     * constructTree creates a tree for the logical operators
     * Reference: https://github.com/lnogueir/expression-tree-gen, https://lnogueir.github.io/expression-tree-gen/
     */
    constructTree(postfix) {
        const OPERATORS = ['OR', 'AND', 'or', 'and'];
        var stack = [];
        var root = null;
        var current;
        var shift = false;
        for (var i = postfix.length - 1; i >= 0; i--) {
            if (null === root) {
                current = new ParserNode(postfix[i]);
                root = current;
            } else {
                if (shift) {
                    current.left = new ParserNode(postfix[i]);
                    current = current.left;
                    shift = false;
                } else {
                    current.right = new ParserNode(postfix[i]);
                    current = current.right;
                }
            }
            if (OPERATORS.includes(postfix[i])) {
                stack.push(current);
            } else {
                current = stack.pop();
                shift = true;
            }
        }
        return root;
    }

    formJSON(root, filterList, str = '') {
        if (root.left == null && root.right == null) {
            const regex = /\d+/;
            if (regex.test(root.value)) {
                if(filterList != '')
                {
                    //process left side
                    str += '{' + '"';
                    str += root.field + '":{';
                    str += '"$' + root.operator + '":"';
                    str += root.value + '"}' + '},';
                    var fieldIndex = parseInt(root.value) - 1;
                    var fieldString = filterList[fieldIndex] + ",";
                    return fieldString;
                } else {
                    return '';
                }
                
            }
        } else {
            if (root != null) {
                str += '{' + '"$' + root.value.toLowerCase() + '":[';
            }
            str = str + this.formJSON(root.left, filterList);
            str = str + this.formJSON(root.right, filterList);

            if (str[str.length - 1] == ',')
                str = str.substring(0, str.length - 1);
            str += ']' + '}' + ',';
            return str;
        }
    }

    /**
     * Finds the inddex of corresponding opening bracket
     * @param {type} str
     * @param {type} pos
     */
    findOpeningBracketIndex(str, pos)
    {
        if (str[pos].id != 1) {
            throw new Error('The position must contain a closing bracket');
        }
        let level = 1;
        for (let index = pos - 1; index >= 0; index--)
        {
            if (str[index].id == 0) {
                level--;
            } else if (str[index].id == 1) {
                level++;
            }
            if (level === 0) {
                return index;
            }
        }
        return -1;
    }

    /**
     * Find the index of corresponding closing bracket
     * @param {type} str
     * @param {type} pos
     */
    findClosingBracketIndex(str, pos)
    {
        if (str[pos].id != 0) {
            throw new Error('The position must contain an opening bracket');
        }
        let level = 1;
        for (let index = pos + 1; index < str.length; index++) {
            if (str[index].id == 0) {
                level++;
            } else if (str[index].id == 1) {
                level--;
            }
            if (level === 0) {
                return index;
            }
        }
        return -1;
    }
}