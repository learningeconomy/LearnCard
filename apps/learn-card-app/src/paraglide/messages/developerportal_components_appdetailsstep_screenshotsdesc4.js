/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Screenshotsdesc4Inputs */

const en_developerportal_components_appdetailsstep_screenshotsdesc4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Screenshotsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload or paste screenshot URLs (392×696 recommended, 9:16 aspect ratio)`)
};

const es_developerportal_components_appdetailsstep_screenshotsdesc4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Screenshotsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube o pega URLs de capturas (392×696 recomendado, relación 9:16)`)
};

const fr_developerportal_components_appdetailsstep_screenshotsdesc4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Screenshotsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargez ou collez des URLs de captures (392×696 recommandé, ratio 9:16)`)
};

const ar_developerportal_components_appdetailsstep_screenshotsdesc4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Screenshotsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ارفع أو الصق روابط لقطات الشاشة (392×696 موصى به، نسبة 9:16)`)
};

/**
* | output |
* | --- |
* | "Upload or paste screenshot URLs (392×696 recommended, 9:16 aspect ratio)" |
*
* @param {Developerportal_Components_Appdetailsstep_Screenshotsdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_screenshotsdesc4 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Screenshotsdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Screenshotsdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_screenshotsdesc4(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_screenshotsdesc4(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_screenshotsdesc4(inputs)
	return ar_developerportal_components_appdetailsstep_screenshotsdesc4(inputs)
});
export { developerportal_components_appdetailsstep_screenshotsdesc4 as "developerPortal.components.appDetailsStep.screenshotsDesc" }