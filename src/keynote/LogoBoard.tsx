import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BpsMark } from './parts';
import { DISPLAY, K } from './style';

const Cell: React.FC<{ label: string; children: React.ReactNode; light?: boolean }> = ({ label, children, light }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
    <div
      style={{
        width: '100%',
        height: 380,
        borderRadius: 30,
        background: light ? '#f5f5f7' : K.tile,
        border: `1px solid ${K.tileLine}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
    <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 500, color: K.gray }}>{label}</div>
  </div>
);

const Dot: React.FC<{ s: number }> = ({ s }) => (
  <span style={{ display: 'inline-block', width: s, height: s, borderRadius: '50%', background: K.green }} />
);

/** Planche de marque Base Point : logo retenu, deux variantes, icône d'app. */
export const LogoBoard: React.FC = () => (
  <AbsoluteFill style={{ background: K.bg, padding: '90px 110px', gap: 60 }}>
    <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 600, color: K.gray }}>Base Point · marque</div>
    <div style={{ display: 'flex', gap: 36 }}>
      <Cell label="A · retenu : BPS. (le point vert = le point de base)">
        <BpsMark size={150} />
      </Cell>
      <Cell label="A sur fond clair" light>
        <BpsMark size={150} color="#000" />
      </Cell>
      <Cell label="B · minuscules">
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 160,
            letterSpacing: '-0.045em',
            color: K.ink,
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          bps
          <span style={{ marginLeft: 8 }}>
            <Dot s={28} />
          </span>
        </div>
      </Cell>
    </div>
    <div style={{ display: 'flex', gap: 36 }}>
      <Cell label="C · nom complet, le point du i en vert">
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 104,
            lineHeight: 1,
            letterSpacing: '-0.035em',
            color: K.ink,
            position: 'relative',
          }}
        >
          Base Po
          <span style={{ position: 'relative' }}>
            ı
            <span style={{ position: 'absolute', left: '50%', top: 17, transform: 'translateX(-50%)', fontSize: 0, lineHeight: 0 }}>
              <Dot s={22} />
            </span>
          </span>
          nt
        </div>
      </Cell>
      <Cell label="Icône d'app (A)">
        <div
          style={{
            width: 230,
            height: 230,
            borderRadius: 52,
            background: '#000',
            border: '1px solid rgba(255,255,255,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BpsMark size={74} />
        </div>
      </Cell>
      <Cell label="Icône d'app, version claire" light>
        <div
          style={{
            width: 230,
            height: 230,
            borderRadius: 52,
            background: '#fff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BpsMark size={74} color="#000" />
        </div>
      </Cell>
    </div>
  </AbsoluteFill>
);
