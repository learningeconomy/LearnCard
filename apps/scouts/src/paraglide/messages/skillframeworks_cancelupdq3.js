/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Cancelupdq3Inputs */

const en_skillframeworks_cancelupdq3 = /** @type {(inputs: Skillframeworks_Cancelupdq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancel Update?`)
};

const es_skillframeworks_cancelupdq3 = /** @type {(inputs: Skillframeworks_Cancelupdq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Cancelar Actualización?`)
};

const fr_skillframeworks_cancelupdq3 = /** @type {(inputs: Skillframeworks_Cancelupdq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler la mise à jour ?`)
};

const ar_skillframeworks_cancelupdq3 = /** @type {(inputs: Skillframeworks_Cancelupdq3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء التحديث؟`)
};

/**
* | output |
* | --- |
* | "Cancel Update?" |
*
* @param {Skillframeworks_Cancelupdq3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_cancelupdq3 = /** @type {((inputs?: Skillframeworks_Cancelupdq3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Cancelupdq3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_cancelupdq3(inputs)
	if (locale === "es") return es_skillframeworks_cancelupdq3(inputs)
	if (locale === "fr") return fr_skillframeworks_cancelupdq3(inputs)
	return ar_skillframeworks_cancelupdq3(inputs)
});
export { skillframeworks_cancelupdq3 as "skillFrameworks.cancelUpdQ" }