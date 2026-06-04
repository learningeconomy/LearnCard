/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Confirmdelete1Inputs */

const en_wallet_confirmdelete1 = /** @type {(inputs: Wallet_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to delete this credential?`)
};

const es_wallet_confirmdelete1 = /** @type {(inputs: Wallet_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que deseas eliminar esta credencial?`)
};

const de_wallet_confirmdelete1 = /** @type {(inputs: Wallet_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bist du sicher, dass du diese Berechtigung löschen möchtest?`)
};

const ar_wallet_confirmdelete1 = /** @type {(inputs: Wallet_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد حذف هذه الشهادة؟`)
};

const fr_wallet_confirmdelete1 = /** @type {(inputs: Wallet_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir supprimer ce titre ?`)
};

const ko_wallet_confirmdelete1 = /** @type {(inputs: Wallet_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 자격증명을 삭제하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to delete this credential?" |
*
* @param {Wallet_Confirmdelete1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_confirmdelete1 = /** @type {((inputs?: Wallet_Confirmdelete1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Confirmdelete1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_confirmdelete1(inputs)
	if (locale === "es") return es_wallet_confirmdelete1(inputs)
	if (locale === "de") return de_wallet_confirmdelete1(inputs)
	if (locale === "ar") return ar_wallet_confirmdelete1(inputs)
	if (locale === "fr") return fr_wallet_confirmdelete1(inputs)
	return ko_wallet_confirmdelete1(inputs)
});
export { wallet_confirmdelete1 as "wallet.confirmDelete" }