/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Switchdesc2Inputs */

const en_consentflow_switchdesc2 = /** @type {(inputs: Consentflow_Switchdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deselecting data switches off Live Syncing and activates Selective Sharing, giving you full control over which credentials you share. You can easily revert to Live Syncing at any time.`)
};

const es_consentflow_switchdesc2 = /** @type {(inputs: Consentflow_Switchdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deseleccionar datos desactiva la Sincronización en Vivo y activa el Uso Selectivo, dándote control total.`)
};

const fr_consentflow_switchdesc2 = /** @type {(inputs: Consentflow_Switchdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La désélection des données désactive la synchronisation en direct et active le partage sélectif, vous donnant un contrôle total sur les justificatifs que vous partagez. Vous pouvez facilement revenir à la synchronisation en direct à tout moment.`)
};

const ar_consentflow_switchdesc2 = /** @type {(inputs: Consentflow_Switchdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء تحديد البيانات يوقف المزامنة الحية وينشط المشاركة الانتقائية، مما يمنحك تحكماً كاملاً في المؤهلات التي تشاركها.`)
};

/**
* | output |
* | --- |
* | "Deselecting data switches off Live Syncing and activates Selective Sharing, giving you full control over which credentials you share. You can easily revert t..." |
*
* @param {Consentflow_Switchdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_switchdesc2 = /** @type {((inputs?: Consentflow_Switchdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Switchdesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_switchdesc2(inputs)
	if (locale === "es") return es_consentflow_switchdesc2(inputs)
	if (locale === "fr") return fr_consentflow_switchdesc2(inputs)
	return ar_consentflow_switchdesc2(inputs)
});
export { consentflow_switchdesc2 as "consentFlow.switchDesc" }