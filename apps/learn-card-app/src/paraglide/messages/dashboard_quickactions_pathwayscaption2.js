/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Pathwayscaption2Inputs */

const en_dashboard_quickactions_pathwayscaption2 = /** @type {(inputs: Dashboard_Quickactions_Pathwayscaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open your pathways`)
};

const es_dashboard_quickactions_pathwayscaption2 = /** @type {(inputs: Dashboard_Quickactions_Pathwayscaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abre tus rutas`)
};

const fr_dashboard_quickactions_pathwayscaption2 = /** @type {(inputs: Dashboard_Quickactions_Pathwayscaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrez vos itinéraires`)
};

const ar_dashboard_quickactions_pathwayscaption2 = /** @type {(inputs: Dashboard_Quickactions_Pathwayscaption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`افتح مساراتك`)
};

/**
* | output |
* | --- |
* | "Open your pathways" |
*
* @param {Dashboard_Quickactions_Pathwayscaption2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_pathwayscaption2 = /** @type {((inputs?: Dashboard_Quickactions_Pathwayscaption2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Pathwayscaption2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_pathwayscaption2(inputs)
	if (locale === "es") return es_dashboard_quickactions_pathwayscaption2(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_pathwayscaption2(inputs)
	return ar_dashboard_quickactions_pathwayscaption2(inputs)
});
export { dashboard_quickactions_pathwayscaption2 as "dashboard.quickActions.pathwaysCaption" }