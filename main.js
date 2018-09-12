isChinese = true;

selNPair = null;

numChange$ = new rxjs.Subject();

pointermove$ = rxjs.fromEvent(document, 'pointermove');
pointerup$ = rxjs.fromEvent(document, 'pointerup');
tempY = 0;

$(document).ready(function() {
    onLangChange($('input').get(0));

    $('.pairBtn').remove();
    initBtns();

    numChange$.pipe(
        rxjs.operators.debounceTime(300),
        rxjs.operators.distinctUntilChanged()
    ).subscribe(numberChanged);
});

function numberChanged(num) {
    selNPair = window.bigPairs.find(function(pair) {
        return (isChinese) ? (pair.zh === +num) : (pair.en === +num);
    });
    if (!!selNPair) {
        // * [2018-09-09 20:43] Once I get the selNPair, update pages
        $("#eniframe").get(0).src = 'http://www.churchinmontereypark.org/Docs/Hymn/EnglishHymnal/html/hymns/' + selNPair.en + '.html';
        if (!!selNPair.info) {
            $('#pairinfo').text(selNPair.info);
        } else {
            $('#pairinfo').text('');
        }
        $("#nhymn").val(selNPair.zh);
        $(".cform").get(0).submit();
    }
}

function onLangChange(radio) {
    console.log(radio);
    isChinese = (radio.value === 'zh');
    if (isChinese) {
        console.log($);
        $('.zh').show();
        $('.en').hide();
    } else {
        $('.zh').hide();
        $('.en').show();
    }
    updateBtns();
    // * [2018-09-09 21:02] Update pages
    num = $("#inputnum").get(0).value;
    if (num > 0) {
        numberChanged(num);
    }
}

function onNumPairChanged(value) {
    numChange$.next(value);
}

function onShowFrameChanged(radio) {
    switch (radio.value) {
        case "zh":
            $("#zhiframe").show();
            $("#eniframe").hide();
            $("#zhiframe").css("grid-column-start", "1");
            $("#zhiframe").css("grid-column-end", "3");
            break;
        case "both":
            $("#zhiframe").show();
            $("#eniframe").show();
            $("#zhiframe").css("grid-column-start", "1");
            $("#zhiframe").css("grid-column-end", "2");
            $("#eniframe").css("grid-column-start", "2");
            $("#eniframe").css("grid-column-end", "3");
            break;
        case "en":
            $("#zhiframe").hide();
            $("#eniframe").show();
            $("#eniframe").css("grid-column-start", "1");
            $("#eniframe").css("grid-column-end", "3");
            break;

        default:
            break;
    }
}

function openWindow(lang) {
    if (!!selNPair === false) { return; }
    switch (lang) {
        case "zh":
            window.open('https://www.hymnal.net/en/hymn/ch/' + selNPair.zh);
            break;
        case "en":
            window.open('https://www.hymnal.net/en/hymn/h/' + selNPair.en);
            break;
        default:
            break;
    }
}

function onAddBtn(pair) {
    let isStorePair = false;
    if (!!pair === false) {
        isStorePair = true;
        pair = selNPair;
    }

    if (!!pair === false) {
        alert('Sorry, please select a hymn at first');
        return;
    }
    const btn = $('<button class="cBtn pairBtn" id="' + Date.now() + '">' + ((isChinese) ? pair.zh : pair.en) + '</button>');
    btn.data('selNPair', pair);
    // * [2018-09-11 20:16] Setting its click event
    btn.on('click', function(ev) {
        const target = ev.currentTarget;
        const sel = $(this).data('selNPair');
        numberChanged((isChinese) ? sel.zh : sel.en);
    });

    // * [2018-09-11 20:35] Start to remove this button
    const btnPD$ = rxjs.fromEvent(btn, 'pointerdown');
    try {
        btnPD$.pipe(rxjs.operators.map(function(ev) {
                return pointermove$.pipe(
                    rxjs.operators.takeUntil(
                        pointerup$.pipe(rxjs.operators.merge(
                            pointermove$.pipe(rxjs.operators.first(), rxjs.operators.delay(1000))
                        ))
                    ),
                    rxjs.operators.concat(rxjs.of({ isEnd: true }))
                );
            }),
            rxjs.operators.concatAll(),
            rxjs.operators.withLatestFrom(btnPD$, function(e_move, e_down) {
                if (!!e_move.isEnd === true) {
                    const dy = (tempY === 0) ? 0 : tempY - e_down.screenY;
                    tempY = 0;
                    return [e_down, dy, true];
                } else {
                    tempY = e_move.screenY;
                    return [e_down, e_move.screenY - e_down.screenY];
                }
            })
        ).subscribe(function(data) {
            const target = data[0].currentTarget;
            if (data.length >= 3) {
                if (Math.abs(data[1]) > 100) {
                    removePair($(target).data('selNPair')); // TEST
                    $(target).remove();
                } else {
                    $(target).css('transform', 'translateY(0)');
                }
                return;
            }
            $(target).css('transform', 'translateY(' + data[1] + 'px)');
        });
    } catch (error) {
        console.error(error);
    }

    // * [2018-09-11 20:35] Append that button
    $('.btnContainer').append(btn);
    if (isStorePair) {
        storePair(pair);
    }
}


storeName = 'store';

function storePair(pair) {
    let pairs = [];
    if (!!localStorage.getItem(storeName) === true) {
        pairs = JSON.parse(localStorage.getItem(storeName));
    }
    pairs.push(pair);
    // * [2018-09-11 22:48] Store it back
    localStorage.setItem(storeName, JSON.stringify(pairs));
}

function removePair(pair) {
    let pairs = [];
    if (!!localStorage.getItem(storeName) === true) {
        pairs = JSON.parse(localStorage.getItem(storeName));
    } else {
        return;
    }
    // * [2018-09-11 22:51] Delete it
    const ind = pairs.findIndex(function(p) { return p.zh === pair.zh });
    if (ind < 0) { return; }
    let new_pairs = [];
    for (let i0 = 0; i0 < pairs.length; i0++) {
        if (ind === i0) { continue; }
        new_pairs.push(pairs[i0]);
    }
    // * [2018-09-11 23:06] Store it back
    localStorage.setItem(storeName, JSON.stringify(new_pairs));
}

function initBtns() {
    let pairs = [];
    if (!!localStorage.getItem(storeName) === false) { return; }
    pairs = JSON.parse(localStorage.getItem(storeName));
    // * [2018-09-11 23:15] insert buttons
    for (let i0 = 0; i0 < pairs.length; i0++) {
        const element = pairs[i0];
        onAddBtn(element);
    }
}

function updateBtns() {
    const btns = $('.pairBtn');
    for (let i0 = 0; i0 < btns.length; i0++) {
        const element = btns[i0];
        const ele$ = $(element);
        const pair = ele$.data('selNPair');
        ele$.text((isChinese) ? pair.zh : pair.en);
    }
}