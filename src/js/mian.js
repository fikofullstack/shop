import '../sass/style.scss';



    var swiper = new Swiper(".mySwiper", {
    spaceBetween: 30,
    loop: true, // чтобы слайды крутились по кругу
    autoplay: {
      delay: 5000, // 5 секунд
      disableOnInteraction: false, // не останавливать после ручного свайпа
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
  });