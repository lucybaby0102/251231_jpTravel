$(function () {
  // start popup
  $('.popStart').on('click', function () {
    var popUrl = $(this).attr('data-popup');
    $('html, body').addClass('fixed');
    $('.popArea').find('img').remove();
    $('.pop, .btnclose').fadeIn(300);
    $('.pop').children('.popArea').append('<img src="images/' + popUrl + '.png" alt="">');

  });

  // close popup
  $('.overlay, .btnclose button').on('click', function () {
    $('.popArea').find('img').remove();
    $('.pop, .btnclose').hide();
    $('html, body').removeClass('fixed'); 
  });

  //app btn
  $('.DL-group .btn').mouseover(function () { 
    
    var btnUrl = $(this).data('btn');
    console.log('btnUrl', btnUrl);
    
    $(this).children().attr('src','images/' + btnUrl + '-on.png');
  });

  $('.DL-group .btn').mouseout(function () { 
    var btnUrl = $(this).data('btn');
    $(this).children().attr('src','images/' + btnUrl + '-off.png');
  });

});
