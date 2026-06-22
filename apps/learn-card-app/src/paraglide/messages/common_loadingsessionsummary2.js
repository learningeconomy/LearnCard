/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Loadingsessionsummary2Inputs */

const en_common_loadingsessionsummary2 = /** @type {(inputs: Common_Loadingsessionsummary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading Session Summary...`)
};

const es_common_loadingsessionsummary2 = /** @type {(inputs: Common_Loadingsessionsummary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando resumen de la sesión...`)
};

const fr_common_loadingsessionsummary2 = /** @type {(inputs: Common_Loadingsessionsummary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement du résumé de la session...`)
};

const ar_common_loadingsessionsummary2 = /** @type {(inputs: Common_Loadingsessionsummary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل ملخص الجلسة...`)
};

/**
* | output |
* | --- |
* | "Loading Session Summary..." |
*
* @param {Common_Loadingsessionsummary2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_loadingsessionsummary2 = /** @type {((inputs?: Common_Loadingsessionsummary2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Loadingsessionsummary2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_loadingsessionsummary2(inputs)
	if (locale === "es") return es_common_loadingsessionsummary2(inputs)
	if (locale === "fr") return fr_common_loadingsessionsummary2(inputs)
	return ar_common_loadingsessionsummary2(inputs)
});
export { common_loadingsessionsummary2 as "common.loadingSessionSummary" }