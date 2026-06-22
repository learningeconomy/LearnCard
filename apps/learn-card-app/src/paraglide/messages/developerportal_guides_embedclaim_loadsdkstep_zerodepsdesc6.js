/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepsdesc6Inputs */

const en_developerportal_guides_embedclaim_loadsdkstep_zerodepsdesc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The SDK is a single optimized file (~15KB gzipped) with no external dependencies. It works on any website — no React, Vue, or framework required.`)
};

const es_developerportal_guides_embedclaim_loadsdkstep_zerodepsdesc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El SDK es un único archivo optimizado (~15KB comprimido) sin dependencias externas. Funciona en cualquier sitio web — sin necesidad de React, Vue, ni ningún framework.`)
};

const fr_developerportal_guides_embedclaim_loadsdkstep_zerodepsdesc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le SDK est un fichier unique optimisé (~15 Ko compressé) sans dépendances externes. Il fonctionne sur n'importe quel site — sans React, Vue ou framework requis.`)
};

const ar_developerportal_guides_embedclaim_loadsdkstep_zerodepsdesc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK هو ملف واحد محسن (~15 كيلوبايت مضغوط) بدون تبعيات خارجية. يعمل على أي موقع ويب — بدون الحاجة إلى React أو Vue أو أي إطار عمل.`)
};

/**
* | output |
* | --- |
* | "The SDK is a single optimized file (~15KB gzipped) with no external dependencies. It works on any website — no React, Vue, or framework required." |
*
* @param {Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepsdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_loadsdkstep_zerodepsdesc6 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepsdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepsdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_loadsdkstep_zerodepsdesc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_loadsdkstep_zerodepsdesc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_loadsdkstep_zerodepsdesc6(inputs)
	return ar_developerportal_guides_embedclaim_loadsdkstep_zerodepsdesc6(inputs)
});
export { developerportal_guides_embedclaim_loadsdkstep_zerodepsdesc6 as "developerPortal.guides.embedClaim.loadSdkStep.zeroDepsDesc" }