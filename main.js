isChinese = true;

selNPair = undefined;

numChange$ = new rxjs.Subject();

$(document).ready(function() {
    onLangChange($('input').get(0));

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