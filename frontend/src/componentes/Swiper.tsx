// src/componentes/Swiper.tsx

import { ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

interface SliderProps {
  children: ReactNode[];
  slidesPerView?: number;
  spaceBetween?: number;
  navigation?: boolean;
  loop?: boolean;
  breakpoints?: any;
}

export default function Slider({
  children,
  slidesPerView = 4.2,
  spaceBetween = 20,
  navigation = true,
  loop = false,
  breakpoints
}: SliderProps) {
  return (
    <div className="w-full overflow-hidden min-w-0">
      <Swiper
        modules={[Navigation]}
        slidesPerView={slidesPerView}
        spaceBetween={spaceBetween}
        navigation={navigation}
        loop={loop}
        grabCursor
        breakpoints={breakpoints}
      >
        {children.map((child, index) => (
          <SwiperSlide key={index}>
            {child}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
