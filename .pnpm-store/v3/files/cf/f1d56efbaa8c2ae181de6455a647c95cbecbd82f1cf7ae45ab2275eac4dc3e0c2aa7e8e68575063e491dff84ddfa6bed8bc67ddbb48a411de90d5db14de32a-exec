const DEFAULT_CACAO_REVOCATION_PHASE_OUT = 24 * 60 * 60;
export class SignatureUtils {
    static async verifyCommitSignature(commitData, did, controller, model, streamId) {
        const cacao = await this._verifyCapabilityAuthz(commitData, streamId, model);
        const atTime = commitData.timestamp ? new Date(commitData.timestamp * 1000) : undefined;
        await did.verifyJWS(commitData.envelope, {
            atTime: atTime,
            issuer: controller,
            disableTimecheck: commitData.disableTimecheck,
            capability: cacao,
            revocationPhaseOutSecs: DEFAULT_CACAO_REVOCATION_PHASE_OUT,
        });
    }
    static async _verifyCapabilityAuthz(commitData, streamId, model) {
        const cacao = commitData.capability;
        if (!cacao)
            return null;
        const resources = cacao.p.resources;
        const payloadCID = commitData.envelope.link.toString();
        if (!resources.includes(`ceramic://*`) &&
            !resources.includes(`ceramic://${streamId.toString()}`) &&
            !resources.includes(`ceramic://${streamId.toString()}?payload=${payloadCID}`) &&
            !(model && resources.includes(`ceramic://*?model=${model.toString()}`))) {
            throw new Error(`Capability does not have appropriate permissions to update this Stream`);
        }
        return cacao;
    }
}
//# sourceMappingURL=signature_utils.js.map