import React from 'react';

export default function TwitchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path 
        d="M2.5,5l0,14.5l5,0l0,2.5l2,0l3,-2.5l4,0l5,-5.5l0,-12l-17.5,0l-1.5,3Z"
        stroke='currentColor'
      />
      <path
        d="M5.5,4l0,12l4,0l0,3l2.5,-3l4.5,0l3,-3l0,-9l-14,0Z"
        stroke='currentColor'
      />
      <rect 
        x="10" y="7" width="2" height="5.5"
        fill='currentColor'
      />
      <rect 
        x="15" y="7" width="2" height="5.5"
        fill='currentColor'
      />
    </svg>
  );
}
