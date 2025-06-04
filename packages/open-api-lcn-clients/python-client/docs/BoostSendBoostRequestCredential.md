# BoostSendBoostRequestCredential


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendBoostRequestCredentialAnyOfContextInner]**](BoostSendBoostRequestCredentialAnyOfContextInner.md) |  | 
**id** | **str** |  | [optional] 
**type** | **List[str]** |  | 
**issuer** | [**BoostSendBoostRequestCredentialAnyOfIssuer**](BoostSendBoostRequestCredentialAnyOfIssuer.md) |  | 
**credential_subject** | [**BoostSendBoostRequestCredentialAnyOfCredentialSubject**](BoostSendBoostRequestCredentialAnyOfCredentialSubject.md) |  | 
**refresh_service** | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md) |  | [optional] 
**credential_schema** | [**BoostSendBoostRequestCredentialAnyOfCredentialSchema**](BoostSendBoostRequestCredentialAnyOfCredentialSchema.md) |  | [optional] 
**issuance_date** | **str** |  | [optional] 
**expiration_date** | **str** |  | [optional] 
**credential_status** | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md) |  | [optional] 
**name** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**valid_from** | **str** |  | [optional] 
**valid_until** | **str** |  | [optional] 
**status** | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md) |  | [optional] 
**terms_of_use** | [**BoostSendBoostRequestCredentialAnyOfTermsOfUse**](BoostSendBoostRequestCredentialAnyOfTermsOfUse.md) |  | [optional] 
**evidence** | [**BoostSendBoostRequestCredentialAnyOfEvidence**](BoostSendBoostRequestCredentialAnyOfEvidence.md) |  | [optional] 
**proof** | [**BoostSendBoostRequestCredentialAnyOfProof**](BoostSendBoostRequestCredentialAnyOfProof.md) |  | 
**protected** | **str** |  | 
**iv** | **str** |  | 
**ciphertext** | **str** |  | 
**tag** | **str** |  | 
**aad** | **str** |  | [optional] 
**recipients** | [**List[BoostSendBoostRequestCredentialAnyOf1RecipientsInner]**](BoostSendBoostRequestCredentialAnyOf1RecipientsInner.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_send_boost_request_credential import BoostSendBoostRequestCredential

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendBoostRequestCredential from a JSON string
boost_send_boost_request_credential_instance = BoostSendBoostRequestCredential.from_json(json)
# print the JSON string representation of the object
print(BoostSendBoostRequestCredential.to_json())

# convert the object into a dict
boost_send_boost_request_credential_dict = boost_send_boost_request_credential_instance.to_dict()
# create an instance of BoostSendBoostRequestCredential from a dict
boost_send_boost_request_credential_from_dict = BoostSendBoostRequestCredential.from_dict(boost_send_boost_request_credential_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


