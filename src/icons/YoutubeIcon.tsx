import React from 'react';

export default function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12,4c5,0 8,0.5 8,0.5c0,0 1.949,0.551 2.5,3c0.338,1.5 0.5,3.5 0.5,4.5c0,1 -0.162,3 -0.5,4.5c-0.549,2.439 -2.5,3 -2.5,3c0,0 -3,0.5 -8,0.5c-5,0 -8,-0.5 -8,-0.5c0,0 -1.946,-0.561 -2.497,-3c-0.338,-1.5 -0.502,-3.5 -0.503,-4.5c-0.001,-1 0.161,-3 0.5,-4.5c0.551,-2.439 2.5,-3 2.5,-3c0,0 3,-0.5 8,-0.5Z"
        stroke='currentColor'
      />
      <path
        d="M9.5,8.5l0,7l6.5,-3.5l-6.5,-3.5Z"
        stroke='currentColor'
        fill="currentColor"
      />
    </svg>
  );
}
     