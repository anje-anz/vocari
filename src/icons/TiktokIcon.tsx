import React from 'react';

export default function TiktokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M13.172,1l3.276,0c0,0 0.468,5.617 5.149,5.617l0,3.277c0,-0 -2.808,0.468 -5.149,-2.341l0,8.426c0,-0 0.541,7.021 -6.948,7.021c-7.491,0 -7,-7 -7,-7c0,0 0.374,-6.574 7.863,-6.574l0,3.276c0,0 -4.681,-0.468 -4.681,3.745c0,4.213 4.318,3.553 4.318,3.553c0,0 3.172,-0.277 3.172,-4.021l-0,-14.979Z"
        stroke='currentColor'
      />
    </svg>
  );
}