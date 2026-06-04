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

const de_alerts_emptyarchived1 = /** @type {(inputs: Alerts_Emptyarchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keine archivierten Benachrichtigungen`)
};

const ar_alerts_emptyarchived1 = /** @type {(inputs: Alerts_Emptyarchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد تنبيهات مؤرشفة`)
};

const fr_alerts_emptyarchived1 = /** @type {(inputs: Alerts_Emptyarchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune alerte archivée`)
};

const ko_alerts_emptyarchived1 = /** @type {(inputs: Alerts_Emptyarchived1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`보관된 알림 없음`)
};

/**
* | output |
* | --- |
* | "No archived alerts" |
*
* @param {Alerts_Emptyarchived1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_emptyarchived1 = /** @type {((inputs?: Alerts_Emptyarchived1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Emptyarchived1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_emptyarchived1(inputs)
	if (locale === "es") return es_alerts_emptyarchived1(inputs)
	if (locale === "de") return de_alerts_emptyarchived1(inputs)
	if (locale === "ar") return ar_alerts_emptyarchived1(inputs)
	if (locale === "fr") return fr_alerts_emptyarchived1(inputs)
	return ko_alerts_emptyarchived1(inputs)
});
export { alerts_emptyarchived1 as "alerts.emptyArchived" }