/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedcode_Sdktargetdesc4Inputs */

const en_developerportal_dashboards_tabs_embedcode_sdktargetdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdktargetdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CSS selector or DOM element to render the claim button into.`)
};

const es_developerportal_dashboards_tabs_embedcode_sdktargetdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdktargetdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selector CSS o elemento DOM donde se renderizará el botón de reclamo.`)
};

const fr_developerportal_dashboards_tabs_embedcode_sdktargetdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdktargetdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélecteur CSS ou élément DOM pour afficher le bouton de réclamation.`)
};

const ar_developerportal_dashboards_tabs_embedcode_sdktargetdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdktargetdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مُحدد CSS أو عنصر DOM لتقديم زر المطالبة فيه.`)
};

/**
* | output |
* | --- |
* | "CSS selector or DOM element to render the claim button into." |
*
* @param {Developerportal_Dashboards_Tabs_Embedcode_Sdktargetdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedcode_sdktargetdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedcode_Sdktargetdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedcode_Sdktargetdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedcode_sdktargetdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedcode_sdktargetdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedcode_sdktargetdesc4(inputs)
	return ar_developerportal_dashboards_tabs_embedcode_sdktargetdesc4(inputs)
});
export { developerportal_dashboards_tabs_embedcode_sdktargetdesc4 as "developerPortal.dashboards.tabs.embedCode.sdkTargetDesc" }