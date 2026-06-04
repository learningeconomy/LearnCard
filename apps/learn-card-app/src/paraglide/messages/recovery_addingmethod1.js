/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Addingmethod1Inputs */

const en_recovery_addingmethod1 = /** @type {(inputs: Recovery_Addingmethod1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adding another method improves your security.`)
};

const es_recovery_addingmethod1 = /** @type {(inputs: Recovery_Addingmethod1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar otro método mejora tu seguridad.`)
};

const de_recovery_addingmethod1 = /** @type {(inputs: Recovery_Addingmethod1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eine weitere Methode erhöht deine Sicherheit.`)
};

const ar_recovery_addingmethod1 = /** @type {(inputs: Recovery_Addingmethod1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة طريقة أخرى يعزز أمانك.`)
};

const fr_recovery_addingmethod1 = /** @type {(inputs: Recovery_Addingmethod1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une autre méthode améliore votre sécurité.`)
};

const ko_recovery_addingmethod1 = /** @type {(inputs: Recovery_Addingmethod1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`다른 방법을 추가하면 보안이 강화됩니다.`)
};

/**
* | output |
* | --- |
* | "Adding another method improves your security." |
*
* @param {Recovery_Addingmethod1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_addingmethod1 = /** @type {((inputs?: Recovery_Addingmethod1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Addingmethod1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_addingmethod1(inputs)
	if (locale === "es") return es_recovery_addingmethod1(inputs)
	if (locale === "de") return de_recovery_addingmethod1(inputs)
	if (locale === "ar") return ar_recovery_addingmethod1(inputs)
	if (locale === "fr") return fr_recovery_addingmethod1(inputs)
	return ko_recovery_addingmethod1(inputs)
});
export { recovery_addingmethod1 as "recovery.addingMethod" }