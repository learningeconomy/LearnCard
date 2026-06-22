/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Features_Displaypathwaysdesc4Inputs */

const en_developerportal_guides_embedapp_features_displaypathwaysdesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Displaypathwaysdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visualize a user's journey. Show completed steps and what credentials they need to reach a goal.`)
};

const es_developerportal_guides_embedapp_features_displaypathwaysdesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Displaypathwaysdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visualize a user's journey. Show completed steps and what credentials they need to reach a goal.`)
};

const fr_developerportal_guides_embedapp_features_displaypathwaysdesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Displaypathwaysdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visualize a user's journey. Show completed steps and what credentials they need to reach a goal.`)
};

const ar_developerportal_guides_embedapp_features_displaypathwaysdesc4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Displaypathwaysdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visualize a user's journey. Show completed steps and what credentials they need to reach a goal.`)
};

/**
* | output |
* | --- |
* | "Visualize a user's journey. Show completed steps and what credentials they need to reach a goal." |
*
* @param {Developerportal_Guides_Embedapp_Features_Displaypathwaysdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_features_displaypathwaysdesc4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Features_Displaypathwaysdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Features_Displaypathwaysdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_features_displaypathwaysdesc4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_features_displaypathwaysdesc4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_features_displaypathwaysdesc4(inputs)
	return ar_developerportal_guides_embedapp_features_displaypathwaysdesc4(inputs)
});
export { developerportal_guides_embedapp_features_displaypathwaysdesc4 as "developerPortal.guides.embedApp.features.displayPathwaysDesc" }