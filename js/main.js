'use strict';

window.addEventListener('load', function() {

    const S = {}; //svg paths container
    let UNIT = 'mm';

    const UTILS = {
        map(n, start1, stop1, start2, stop2) {
            return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
        },

        emptyFunc() {},

        toSideOfSquare(diag) {
            return Math.sqrt((diag * diag) / 2);
        },

        //default value chaining
        asDefault(chain) {
            let value;

            for (const currValue of chain) {
                value = currValue;
                if (value !== undefined)
                    break;
            }

            return value;
        }
    }

    const CONTROLS_PREFS = [
            ["paperWidth", { name: `Width [${UNIT}]`, _folder: "Paper", min: 1, step: 1, onFinishChange: defFinish, onChange: paperResized }],
            ["showBorder", { name: "Paper border:", _folder: "Paper", _value: true, onChange: togglePaper }],
            ["width", { name: `Width [${UNIT}]`, _folder: "Box", _value: 50, min: 1, step: 1, onFinishChange: defFinish, onChange: defChange }],
            ["_length", { name: `Length [${UNIT}]`, _folder: "Box", _value: 50, min: 1, step: 1, onFinishChange: defFinish, onChange: defChange }],
            ["height", { name: `Height [${UNIT}]`, _folder: "Box", _value: 20, min: 1, step: 1, onFinishChange: defFinish, onChange: defChange }],
            ["save", { name: "Save SVG", _value: saveSvg }],
        ],
        CONTROLS = {},
        CONTROLS_VALS = {},
        CONTROLS_OLD = {};

    function updateOld() {
        Object.assign(CONTROLS_OLD, CONTROLS_VALS);
    }

    //DAT GUI CALLBACKS
    function saveSvg() {
        let paperWidth = Math.round(CONTROLS_VALS.paperWidth) + UNIT;
        let width = Math.round(CONTROLS_VALS.width);
        let height = Math.round(CONTROLS_VALS.height);
        let _length = Math.round(CONTROLS_VALS._length);

        let svgData = S.draw.clone().size(paperWidth, paperWidth);

        let preface = '<?xml version="1.0" encoding="utf-8"?>\r\n';

        saveAs([preface, svgData.svg()], `origami-box_${paperWidth}_${width}x${_length}x${height}.svg`, { type: "image/svg+xml;charset=utf-8" });
    }

    function saveAs(data, name, opts) {
        let svgBlob = new Blob([...data], opts);
        let svgUrl = URL.createObjectURL(svgBlob);
        let tempLink = document.createElement("a");
        tempLink.href = svgUrl;
        tempLink.download = name || 'untitled';
        // document.body.appendChild(tempLink);
        tempLink.click();
        // document.body.removeChild(tempLink);
    }

    function defChange(value) {
        resizePaper();
        update();
    }

    function togglePaper(value) {
        update();
    }

    function defFinish() {
        updateOld();
    }

    function paperResized(paperWidth) {
        resizeBox(paperWidth);
        update();
    }

    //

    function resizePaper() {

        let height = CONTROLS_VALS.height,
            width = CONTROLS_VALS.width,
            _length = CONTROLS_VALS._length;

        let sideWidth = UTILS.toSideOfSquare(width);
        let side_length = UTILS.toSideOfSquare(_length);
        let diagHeight = Math.hypot(height, height);

        let paperWidth = sideWidth + side_length + diagHeight * 2;

        setValue('paperWidth', paperWidth);
    }

    function resizeBox(paperWidth) {

        let _height = CONTROLS_OLD.height,
            _width = CONTROLS_OLD.width,
            __length = CONTROLS_OLD._length,
            _paperWidth = CONTROLS_OLD.paperWidth;

        let w = UTILS.toSideOfSquare(_width) / _paperWidth * paperWidth;
        let d = UTILS.toSideOfSquare(__length) / _paperWidth * paperWidth;
        let h = Math.hypot(_height, _height) / _paperWidth * paperWidth;

        w = Math.hypot(w, w);
        d = Math.hypot(d, d);
        h = UTILS.toSideOfSquare(h);

        setValue('width', w);
        setValue('_length', d);
        setValue('height', h);
    }

    function init() {
        addGui();

        resizePaper();
        setupSvg();
        update();


        updateOld();
    }

    function update() {
        draw();
    }

    function setupSvg() {
        S.draw = SVG().size('100%', '100%').addTo('.container .svgContainer');
        S.draw.viewbox(0, 0, CONTROLS_VALS.paperWidth, CONTROLS_VALS.paperWidth);

        S.g = S.draw.group();

        S.border = S.draw.path();
        S.border.attr("style", "fill: none; stroke: #000000; stroke-width: 1");
        S.border.attr("vector-effect", "non-scaling-stroke");

        S.base = S.border.clone();
        S.g.add(S.base);

        S.sides = S.border.clone();
        S.g.add(S.sides);

        S.corners = S.sides.clone();
        S.g.add(S.corners);

        S.tops = S.sides.clone();
        S.g.add(S.tops);

        S.over = S.sides.clone();
        S.g.add(S.over);
    }

    function draw() {

        let H = CONTROLS_VALS.height,
            W = CONTROLS_VALS.width,
            D = CONTROLS_VALS._length,
            PW = CONTROLS_VALS.paperWidth,
            W2 = W / 2,
            D2 = D / 2;

        S.draw.viewbox(0, 0, PW, PW);
        S.g.transform({
            rotate: 45,
            translateX: PW / 2,
            translateY: PW / 2
        });

        let P = {
            a: [-W2, -D2],
            b: [-W2, -D2 - H - H],
            c: [W2, -D2 - H - H],
            d: [W2, -D2],
            e: [W2 + H + H, -D2],
            f: [W2 + H + H, D2],
            g: [W2, D2],
            h: [W2, D2 + H + H],
            i: [-W2, D2 + H + H],
            j: [-W2, D2],
            k: [-W2 - H - H, D2],
            l: [-W2 - H - H, -D2],
            m: [-W2 - H, -D2 - H],
            n: [W2 + H, -D2 - H],
            o: [W2 + H, D2 + H],
            p: [-W2 - H, D2 + H],
        }

        let diag = (P.p[1] * 2 + W + H + H);
        let halfDiag = diag / 2;

        /*
                      B————————C
                      |        |
                  M———|————————|———N
                  | \ |        | / |
              L———|———A————————D———|———E
              |   |   |        |   |   |
              |   |   |        |   |   |
              |   |   |        |   |   |
              |   |   |        |   |   |
              K———|———J————————G———|———F
                  | / |        | \ |
                  P———|————————|———O
                      |        |
                      I————————H      
            */

        ////PAPER BORDER
        S.border.plot([
            'M', [0, 0],
            'L', [PW, 0],
            'L', [PW, PW],
            'L', [0, PW],
            'z',
        ]);

        ////BASE
        S.base.plot([
            'M', ...P.a,
            'L', ...P.d,
            'L', ...P.g,
            'L', ...P.j,
            'z',
        ]);

        ////SIDES
        S.sides.plot([
            //UP
            'M', ...P.a,
            'L', ...P.b,
            'L', ...P.c,
            'L', ...P.d,
            //RIGHT
            'L', ...P.e,
            'L', ...P.f,
            'L', ...P.g,
            //BOTTOM
            'L', ...P.h,
            'L', ...P.i,
            'L', ...P.j,
            //LEFT
            'L', ...P.k,
            'L', ...P.l,
            'z',
        ]);

        ////CORNERS FOLDS
        S.corners.plot([
            //UP LEFT
            'M', ...P.a,
            'L', ...P.m,
            //UP RIGHT
            'M', ...P.d,
            'L', ...P.n,
            //BOTTOM RIGHT
            'M', ...P.g,
            'L', ...P.o,
            //BOTTOM LEFT
            'M', ...P.j,
            'L', ...P.p,
        ]);

        ////TOP FOLDS
        S.tops.plot([
            'M', ...P.m,
            'L', ...P.n,
            'L', ...P.o,
            'L', ...P.p,
            'z',
        ]);

        ////OVERFLOW FOLDS
        let p, o, i, s;
        let path = [];

        p = P.i; //reference point
        o = p[1] + D; //offset
        i = 0; //increment
        s = [H, H, D]; //added to offset

        while (o < halfDiag) {

            let crop = o - p[1],
                x1 = p[0] + crop,
                x2 = p[0] + W - crop;

            let pos = [
                //BOTTOM
                'M', x1, o,
                'L', x2, o,
                //TOP
                'M', x1, -o,
                'L', x2, -o,
            ];

            path.push(...pos);

            o += s[i];
            i = (i + 1) % s.length;
        }

        p = P.f;
        o = p[0] + W;
        i = 0;
        s = [H, H, W];

        while (o < halfDiag) {

            let crop = o - p[0],
                y1 = p[1] - crop,
                y2 = p[1] - D + crop;

            path.push(...[
                //RIGHT
                'M', o, y1,
                'L', o, y2,
                //LEFT
                'M', -o, y1,
                'L', -o, y2,
            ]);

            o += s[i];
            i = (i + 1) % s.length;
        }

        if (path.length) {
            S.g.add(S.over);
            S.over.plot(path);
        } else {
            S.over.remove();
        }

        if (CONTROLS_VALS.showBorder) {
            S.draw.add(S.border);
        } else {
            S.border.remove();
        }
    }

    function setValue(name, value) {
        value = CONTROLS_VALS[name] = value;
        CONTROLS[name].updateDisplay();
    }

    function addGui() {

        let dat_gui = new dat.GUI({ autoPlace: false }),
            folders = {};

        for (let [currName, currPrefs] of CONTROLS_PREFS) {

            let folder = getFolder(currPrefs._folder) || dat_gui;

            CONTROLS_VALS[currName] = UTILS.asDefault([currPrefs._value, currPrefs.min, 0]);

            let currController = folder.add(CONTROLS_VALS, currName);
            CONTROLS[currName] = currController;

            for (let currPropertyName in currPrefs) {

                if (currPropertyName.includes('_'))
                    continue;

                currController[currPropertyName](currPrefs[currPropertyName]);
            }
        }

        function getFolder(name) {
            if (!name)
                return undefined;

            return folders[name] || addGuiFolder(name);
        }

        function addGuiFolder(name, open = true) {
            let folder = dat_gui.addFolder(name);
            folders[name] = folder;

            if (open) folder.open();
            return folder;
        }

        dat_gui.domElement.id = 'datgui';
        document.body.appendChild(dat_gui.domElement);
    }

    init();
});