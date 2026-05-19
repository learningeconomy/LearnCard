import type { SuiteAdapter } from '../types';
import { renderSvgMustache } from '../renderer/renderSvgMustache';

/**
 * The default starter template shipped with the designer. Structurally aligned with the
 * canonical hosted template at `packages/render-method-templates/svg/card/card-1.0.0.svg` but
 * intentionally simpler — just enough to demonstrate dotted paths, sections, and inverted
 * sections so a new author sees Mustache features without being overwhelmed.
 */
const STARTER_TEMPLATE = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="200" viewBox="0 0 360 200">
  <rect width="360" height="200" rx="16" fill="#18224E"/>
  <rect x="16" y="16" width="60" height="4" rx="2" fill="#5FBE88"/>
  <text x="16" y="44" font-family="Poppins, Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="1.6" fill="#FFFFFF">LEARNCARD</text>

  {{#name}}
  <text x="16" y="100" font-family="Poppins, Arial, sans-serif" font-size="22" font-weight="700" fill="#FFFFFF">{{name}}</text>
  {{/name}}

  {{#credentialSubject.name}}
  <text x="16" y="140" font-family="Poppins, Arial, sans-serif" font-size="13" font-weight="500" fill="#C5C8D3">Issued to {{credentialSubject.name}}</text>
  {{/credentialSubject.name}}

  {{#issuer.name}}
  <text x="16" y="172" font-family="Poppins, Arial, sans-serif" font-size="11" font-weight="500" fill="#8B91A7">by {{issuer.name}}</text>
  {{/issuer.name}}
</svg>`;

/**
 * Built-in SVG Mustache adapter. Mirrors the existing renderer in
 * `apps/learn-card-app/src/helpers/renderMethod.helpers.ts` and the plugin's hardcoded suite
 * name (`packages/plugins/render-method/src/plugin.ts:79`).
 */
export const svgMustacheAdapter: SuiteAdapter = {
    suite: 'svg-mustache',
    mediaType: 'image/svg+xml',
    label: 'SVG (Mustache)',
    render: renderSvgMustache,
    starterTemplate: STARTER_TEMPLATE,
};
