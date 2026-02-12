import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Sans"', 'sans-serif'],
      },
      fontWeight: {
        light: '400',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '600',
        extrabold: '600',
        black: '600',
      },
      colors: {
        bg: 'var(--bg)',
        sf: 'var(--sf)',
        s2: 'var(--s2)',
        hv: 'var(--hv)',
        ac: 'var(--ac)',
        tx: 'var(--tx)',
        t2: 'var(--t2)',
        t3: 'var(--t3)',
        bd: 'var(--bd)',
        bl: 'var(--bl)',
        gn: 'var(--gn)',
        rd: 'var(--rd)',
        am: 'var(--am)',
        vi: 'var(--vi)',
        cy: 'var(--cy)',
        pk: 'var(--pk)',
        gl: 'var(--gl)',
        sc: 'var(--sc)',
      },
    },
  },
  plugins: [],
};

export default config;
