import { Config } from '@remotion/cli/config';

// WebGL via ANGLE + SwiftShader (swangle) : rendu 3D identique sur toutes les machines, même sans GPU.
Config.setChromiumOpenGlRenderer('swangle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setConcurrency(2);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
