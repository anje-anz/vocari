import React, { useState } from 'react';
import {
  AudioWaveform, Radio, Settings, ExternalLink,
  PanelLeftClose, PanelLeftOpen, ChevronRight
} from 'lucide-react';
import { YoutubeIcon, TwitchIcon, TiktokIcon, InstagramIcon } from '../../icons';
export const Sidebar: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`
      h-screen ${open ? 'w-64' : 'w-16'} 
      flex flex-col space-y-1
      backdrop-blur-sm
      transition-all duration-500 ease-out
    `}>
      <div className='absolute right-0 h-full w-[1px] bg-linear-to-b from-cyan-50 to-cyan-100 opacity-10' />
      <div className='h-2 w-full'/>
      <button
        className={`
          absolute w-fit h-fit ml-2 top-3 z-40 
          ${open ? 'left-64' : 'left-16'} 
          backdrop-blur-sm 
          border border-white/20 rounded-lg hover:bg-cyan-50/10 
          transition-all duration-500 ease-out
        `}
        onClick={() => setOpen(v => !v)}
      >
        {open ? <PanelLeftClose className="w-5 h-5 stroke-1 m-2" /> : <PanelLeftOpen className="w-5 h-5 stroke-1 m-2" />}
      </button>

      <div className='flex justify-center-safe px-3'>
        <div className='relative flex w-full hover:bg-cyan-50/10 rounded-lg overflow-hidden'>
          <AudioWaveform className='w-6 h-6 stroke-1 m-2' />
          <div className='absolute flex self-center ml-10 text-nowrap'>Sintetizza</div>
        </div>
      </div>

      <div className='flex justify-center-safe px-3'>
        <div className='flex flex-col w-full ring ring-cyan-50/20 rounded-lg overflow-hidden'>
          <button 
            className='
              relative flex z-40 mx-0.5 mt-0.5
            hover:bg-cyan-50/10 inset-ring inset-ring-cyan-50/20 rounded-[0.375rem]
            '
            onClick={() => setCollapsed(prev => !prev)}
          >
            <Radio className='w-6 h-6 stroke-1 m-1.5' />
            <div className='absolute flex flex-row w-full h-full justify-between items-center'>
              <div className='ml-10 text-nowrap'>LiveChat</div>
              <ChevronRight className={`mr-2 w-4 h-4 opacity-70 transition-transform duration-200 ease-out ${collapsed ? 'rotate-0' : 'rotate-90'}`} />
            </div>
          </button>
          <div
            className={`min-h-0.5 relative grid transition-[grid-template-rows] duration-500 ease-out
              ${collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
          >
            <div className="space-y-1 overflow-hidden">
              <div className='flex m-0.5 hover:bg-cyan-50/10 rounded-[0.375rem]'>
                <YoutubeIcon className='w-6 h-6 m-1.5 opacity-70' />
                <div className='absolute flex self-center ml-10 text-nowrap'>YouTube</div>
              </div>
              <div className='flex m-0.5 hover:bg-cyan-50/10 rounded-[0.375rem]'>
                <TwitchIcon className='w-6 h-6 m-1.5 opacity-70' />
                <div className='absolute flex self-center ml-10 text-nowrap'>Twitch</div>
              </div>
              <div className='flex m-0.5 hover:bg-cyan-50/10 rounded-[0.375rem]'>
                <TiktokIcon className='w-6 h-6 m-1.5 opacity-70' />
                <div className='absolute flex self-center ml-10 text-nowrap'>TikTok</div>
              </div>
              <div className='flex m-0.5 hover:bg-cyan-50/10 rounded-[0.375rem]'>
                <InstagramIcon className='w-6 h-6 m-1.5 opacity-70' />
                <div className='absolute flex self-center ml-10 text-nowrap'>Istagram</div>
              </div>
            </div>
          </div>


        </div>
      </div>

      <div className='flex justify-center-safe px-3'>
        <div className='relative flex w-full hover:bg-cyan-50/10 rounded-lg overflow-hidden'>
          <Settings className='w-6 h-6 stroke-1 m-2' />
          <div className='absolute flex self-center ml-10 text-nowrap'>Impostationi</div>
        </div>
      </div>

      <div className='flex justify-center-safe px-3'>
        <div className='relative flex w-full hover:bg-cyan-50/10 rounded-lg overflow-hidden'>
          <ExternalLink className='w-6 h-6 stroke-1 m-2' />
          <div className='absolute flex self-center ml-10 text-nowrap'>Collegamenti Esterni</div>
        </div>
      </div>

    </div>
  );
};
