$(function () {

    "use strict";

    /*================*/
    /* 01 - VARIABLES */
    /*================*/
    var swipers = [], winW, winH, winScr, _isresponsive, smPoint = 768, mdPoint = 992, lgPoint = 1200, addPoint = 1600, _ismobile = navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i);

    /*========================*/
    /* 02 - page calculations */
    /*========================*/
    function pageCalculations() {
        winW = $(window).width();
        winH = $(window).height();
        if ($('.menu-button').is(':visible')) _isresponsive = true;
        else _isresponsive = false;
    }

    /*=================================*/
    /* 03 - function on document ready */
    /*=================================*/
    pageCalculations();

    /*============================*/
    /* 04 - function on page load */
    /*============================*/
    $(window).load(function () {
        $('.loader').fadeOut();
        $('body').addClass('loaded');
        initSwiper();
        animateload();
        showSection(window.location.hash, false);
        var recordPosition = $('.welcome-record-box').offset().top;
        $('.welcome-audio-record').css({top: recordPosition + 3});
    });

    setInterval(function(){
        $('.time-4000').toggleClass('flip-box-rotate');
    }, 4300);
    setInterval(function(){
        $('.time-6000').toggleClass('flip-box-rotate');
    }, 6300);
    setInterval(function(){
        $('.time-8000').toggleClass('flip-box-rotate');
    }, 7700);

    //Animation
    function animateload() {
        var leftValue = 8;
        if (winW < 730) {
            leftValue = 37;
        }
        var topOfWindow = $(window).scrollTop();
        var recordPosition = $('.welcome-record-box').offset().top;
        var posTop = $('.record-element-1').offset().top;
        var posLeft = $('.record-element-1').offset().left;

        if(topOfWindow > 50) {
            $('.scroll').fadeOut();
        } else {
            $('.scroll').fadeIn();
        }
        if ($(window).scrollTop() > recordPosition) {
            $('body').addClass('startAnimationWelcome');
            $('.welcome-audio-record').css({top: posTop, left: posLeft + leftValue});
            setTimeout(function () {
                $('.startAnimationWelcome .welcome-audio-record').fadeOut();
            }, 2000)
        } else {
            $('.welcome-audio-record').fadeIn();
            $('body').removeClass('startAnimationWelcome');
            $('.welcome-audio-record').css({top: recordPosition + 3, left: 50 + '%'});
        }

        $('.animation').each(function () {
            var elmentPosition = $(this).offset().top;
            if (topOfWindow + $(window).height() > elmentPosition)
                var animationName = $(this).data('animation');
            $(this).addClass(animationName);
        })
    }


    $(window).on('resize', function () {
        animateload();
    });
    /*==============================*/
    /* 05 - function on page resize */
    /*==============================*/
    function resizeCall() {
        pageCalculations();

        $('.swiper-container.initialized[data-slides-per-view="responsive"]').each(function () {
            var thisSwiper = swipers['swiper-' + $(this).attr('id')], $t = $(this), slidesPerViewVar = updateSlidesPerView($t), centerVar = thisSwiper.params.centeredSlides;
            thisSwiper.params.slidesPerView = slidesPerViewVar;
            thisSwiper.reInit();
            if (!centerVar) {
                var paginationSpan = $t.find('.pagination span');
                var paginationSlice = paginationSpan.hide().slice(0, (paginationSpan.length + 1 - slidesPerViewVar));
                if (paginationSlice.length <= 1 || slidesPerViewVar >= $t.find('.swiper-slide').length) $t.addClass('pagination-hidden');
                else $t.removeClass('pagination-hidden');
                paginationSlice.show();
            }
        });
    }

    if (!_ismobile) {
        $(window).resize(function () {
            resizeCall();
        });
    } else {
        window.addEventListener("orientationchange", function () {
            resizeCall();
        }, false);
    }

    /*=====================*/
    /* 07 - swiper sliders */
    /*=====================*/
    function initSwiper() {
        var initIterator = 0;
        $('.swiper-container').each(function () {
            var $t = $(this);

            var index = 'swiper-unique-id-' + initIterator;

            $t.addClass('swiper-' + index + ' initialized').attr('id', index);
            $t.find('.pagination').addClass('pagination-' + index);

            var autoPlayVar = parseInt($t.attr('data-autoplay'));
            var centerVar = parseInt($t.attr('data-center'));
            var simVar = ($t.closest('.circle-description-slide-box').length) ? false : true;

            var slidesPerViewVar = $t.attr('data-slides-per-view');
            if (slidesPerViewVar == 'responsive') {
                slidesPerViewVar = updateSlidesPerView($t);
            }
            else if (slidesPerViewVar != 'auto') slidesPerViewVar = parseInt(slidesPerViewVar);

            var loopVar = parseInt($t.attr('data-loop'));
            var speedVar = parseInt($t.attr('data-speed'));

            swipers['swiper-' + index] = new Swiper('.swiper-' + index, {
                speed: speedVar,
                pagination: '.pagination-' + index,
                loop: loopVar,
                paginationClickable: true,
                autoplay: autoPlayVar,
                slidesPerView: slidesPerViewVar,
                keyboardControl: true,
                calculateHeight: true,
                simulateTouch: simVar,
                centeredSlides: centerVar,
                roundLengths: true,
                onSlideChangeEnd: function (swiper) {
                    var activeIndex = (loopVar === 1) ? swiper.activeLoopIndex : swiper.activeIndex;
                    var qVal = $t.find('.swiper-slide-active').attr('data-val');
                    $t.find('.swiper-slide[data-val="' + qVal + '"]').addClass('active');
                },
                onSlideChangeStart: function (swiper) {
                    $t.find('.swiper-slide.active').removeClass('active');
                },
                onSlideClick: function (swiper) {

                }
            });
            swipers['swiper-' + index].reInit();
            if (!centerVar) {
                if ($t.attr('data-slides-per-view') == 'responsive') {
                    var paginationSpan = $t.find('.pagination span');
                    var paginationSlice = paginationSpan.hide().slice(0, (paginationSpan.length + 1 - slidesPerViewVar));
                    if (paginationSlice.length <= 1 || slidesPerViewVar >= $t.find('.swiper-slide').length) $t.addClass('pagination-hidden');
                    else $t.removeClass('pagination-hidden');
                    paginationSlice.show();
                }
            }
            initIterator++;
        });

    }

    function updateSlidesPerView(swiperContainer) {
        if (winW >= addPoint) return parseInt(swiperContainer.attr('data-add-slides'));
        else if (winW >= lgPoint) return parseInt(swiperContainer.attr('data-lg-slides'));
        else if (winW >= mdPoint) return parseInt(swiperContainer.attr('data-md-slides'));
        else if (winW >= smPoint) return parseInt(swiperContainer.attr('data-sm-slides'));
        else return parseInt(swiperContainer.attr('data-xs-slides'));
    }

    //swiper arrows
    $('.swiper-arrow-left').click(function () {
        swipers['swiper-' + $(this).parent().attr('id')].swipePrev();
    });

    $('.swiper-arrow-right').click(function () {
        swipers['swiper-' + $(this).parent().attr('id')].swipeNext();
    });

    /*==============================*/
    /* 08 - buttons, clicks, hovers */
    /*==============================*/

    //Menu mobile
    $('.menu-button').on('click', function () {
        $('.navigation').toggleClass('navigation-active');
        $(this).toggleClass('active');
    });

    //Accordion
    $('.accordion-item').each(function () {
        var color = $(this).data('color');
        $(this).find('.accordion-title').css({'borderColor': color});
    });
    $(".accordion-item").on({
        mouseenter: function () {
            var color = $(this).data('color');
            $(this).find('.accordion-title').addClass('isHover').css({'background': color});
        },
        mouseleave: function () {
            var accTitle = $(this).find('.accordion-title');
            if (!accTitle.hasClass('active')) {
                accTitle.removeClass('isHover').css({'background': '#5a7098'});
            }
        }
    });

    $('.accordion-title').on('click', function () {
        var self = $(this);
        var color = self.parent().data('color');
        var circle = $('.circule');
        var round = $('.round');
        var widthBox = $('.music-record-wrapper').width() - 232;
        if (winW < 600) {
            widthBox = $('.music-record-wrapper').width() - 140;
        }
        $('.recording-panel').addClass('recording-panel-active').removeClass('play-music-delay');
        circle.removeClass('default').css({'background': color});
        self.parent().siblings().find('.accordion-content').stop().slideUp(300);
        self.parent().siblings().find('.accordion-title').removeClass('active isHover').css({'background': '#5a7098'});
        self.css({'background': color});
        self.toggleClass('active');
        self.next('.accordion-content').stop().slideDown(300);
        $(".music-record:not(:eq(0))").addClass('animationOut');


        if (!self.hasClass('active')) {
            self.closest('.accordion').find('.accordion-content').stop().slideUp(300);
            circle.addClass('default');
            $('.recording-panel').removeClass('recording-panel-active').addClass('play-music-delay');
            $('.music-record').addClass('animationOut');
        }

        if (self.hasClass('active')) {
            $('.music-record-wrapper').prepend('<div class="music-record clearfix"><div class="round" style="border-color: ' + color + ' "></div><img src="/wp-content/themes/resoures/img/music-record.png" alt=""></div>');
            $('.music-record').css({'borderColor': color}).animate({'left': widthBox}, 300).addClass('music-record-active');
            $(".music-record:not(:eq(0))").addClass('animationOut');

            if (!$('.recording-panel').hasClass('recording-panel-active')) {
                $('.recording-panel').removeClass('recording-panel-active');
            } else {
                $('.recording-panel').addClass('recording-panel-active');
            }
        }
    });

    $('.open-join').on('click', function () {
        $(this).addClass('active');
        $('.open-contact').removeClass('active');
        $('.contact-form').fadeOut(function () {
            $('.join-form').fadeIn();
        })
    });

    $('.open-contact').on('click', function () {
        $(this).addClass('active');
        $('.open-join').removeClass('active');
        $('.join-form').fadeOut(function () {
            $('.contact-form').fadeIn();
        })
    });

    $('.scroll').on('click', function (e) {
        e.preventDefault();
        $('html,body').stop().animate({ scrollTop: $('.sliders-section').offset().top }, 800);
    });

    $(window).on('scroll', function () {
        checkSection();
        animateload();
    });// - > scroll_end

    // - > Scroll_nav_click
    $('.nav-item > a').on('click', function (e) {
        e.preventDefault();
        $('.navigation').removeClass('navigation-active');
        $('.menu-button').removeClass('active');
        showSection($(this).attr('href'), true);
    });

    function showSection(section, isAnimate) {
        var direction = section.replace(/#/, ''),
            reqSection = $('.section').filter('[data-section="' + direction + '"]'),
            reqSectionPos;

        if (reqSection.length) {
            reqSectionPos = reqSection.offset().top;
        }

        if (isAnimate) {
            $('body, html').animate({scrollTop: reqSectionPos}, 500);
        } else {
            $('body, html').scrollTop(reqSectionPos);
        }
    };// - > showSection_end

    function checkSection() {
        $('.section').each(function () {
            var $this = $(this),
                topEdge = $this.offset().top - 50,
                boottomEdge = topEdge + $this.height(),
                wScroll = $(window).scrollTop();

            if (topEdge < wScroll && boottomEdge > wScroll) {
                var currentId = $this.data('section'),
                    reqLink = $('.nav-item > a').filter('[href="#' + currentId + '"]');

                reqLink.parent('.nav-item').addClass('active').siblings().removeClass('active');

                window.location.hash = currentId;
            }
        });
    }; // - > checkSection_end

    var bannerSwiper = $('.banner-swiper').swiper({
        mode: 'horizontal',
        freeMode: true,
        freeModeFluid: true,
        loop: false,
        autoplay: 2000,
        grabCursor: true,
        calculateHeight: true,
        scrollContainer: true,
        mousewheelControl: true,
        mousewheelControlForceToAxis: true,
        visibilityFullFit: false,
        slidesPerView: 'auto'
    });

    var swiperCont = bannerSwiper,
        swiperWrap = $('.banner-swiper .swiper-wrapper'),
        leftNav = $('.slide-left'),
        rightNav = $('.slide-right'),
        scrollDist = 10,
        timeInterval = 30,
        timer;

    function maxWrapperPosition() {
        var wrapperSize = swiperWrap.width();
        var containerSize = swiperCont.width;
        var max = (wrapperSize - containerSize);
        if (max < 0) max = 0;
        return max;
    }

    function hoverhide() {
        var pos = swiperCont.getWrapperTranslate("x")

        if (pos < 0) leftNav.css('display', 'block');
        if (pos >= 0) leftNav.css('display', 'none');

        if (pos == -maxWrapperPosition()) {
            rightNav.css('display', 'none');
        } else
            rightNav.css('display', 'block');
    }
    hoverhide();

    swiperCont.addCallback('SetWrapperTransition', function (swiper) {
        hoverhide();
    });

    function scrollDivLeft() {
        var position = swiperCont.getWrapperTranslate("x") + scrollDist;

        if (position > 0) position = 0;
        if (position < -maxWrapperPosition()) position = -maxWrapperPosition();

        swiperCont.setWrapperTransition(0);
        swiperCont.setWrapperTranslate(position);
        swiperCont.updateActiveSlide(position);

        if (position === 0 || position === -maxWrapperPosition()) return;
    }

    function scrollDivRight() {
        var position = swiperCont.getWrapperTranslate("x") - scrollDist;

        if (position > 0) position = 0;
        if (position < -maxWrapperPosition()) position = -maxWrapperPosition();

        swiperCont.setWrapperTransition(0);
        swiperCont.setWrapperTranslate(position);
        swiperCont.updateActiveSlide(position);

        if (position === 0 || position === -maxWrapperPosition()) return;
    }

    leftNav.hover(function () {
        timer = window.setInterval(scrollDivLeft, timeInterval);
    }, function () {
        window.clearInterval(timer);
    });
    rightNav.hover(function () {
        timer = window.setInterval(scrollDivRight, timeInterval);
    }, function () {
        window.clearInterval(timer);
    });
    

});

