/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Emptyarchived1Inputs */

const en_alerts_emptyarchived1 = /** @type {(inputs: Alerts_Emptyarchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No archived alerts`)
};

const es_alerts_emptyarchived1 = /** @type {(inputs: Alerts_Emptyarchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay alertas archivadas`)
};

const fr_alerts_emptyarchived1 = /** @type {(inputs: Alerts_Emptyarchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune alerte archivée`)
};

const ar_alerts_emptyarchived1 = /** @type {(inputs: Alerts_Emptyarchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد تنبيهات مؤرشفة`)
};

/**
* | output |
* | --- |
* | "No archived alerts" |
*
* @param {Alerts_Emptyarchived1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_emptyarchived1 = /** @type {((inputs?: Alerts_Emptyarchived1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Emptyarchived1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_emptyarchived1(inputs)
	if (locale === "es") return es_alerts_emptyarchived1(inputs)
	if (locale === "fr") return fr_alerts_emptyarchived1(inputs)
	return ar_alerts_emptyarchived1(inputs)
});
export { alerts_emptyarchived1 as "alerts.emptyArchived" }