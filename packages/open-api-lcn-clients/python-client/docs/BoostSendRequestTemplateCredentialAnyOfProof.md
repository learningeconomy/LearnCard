# BoostSendRequestTemplateCredentialAnyOfProof


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **str** |  | 
**created** | **str** |  | 
**challenge** | **str** |  | [optional] 
**domain** | **str** |  | [optional] 
**nonce** | **str** |  | [optional] 
**proof_purpose** | **str** |  | 
**verification_method** | **str** |  | 
**jws** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.boost_send_request_template_credential_any_of_proof import BoostSendRequestTemplateCredentialAnyOfProof

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendRequestTemplateCredentialAnyOfProof from a JSON string
boost_send_request_template_credential_any_of_proof_instance = BoostSendRequestTemplateCredentialAnyOfProof.from_json(json)
# print the JSON string representation of the object
print(BoostSendRequestTemplateCredentialAnyOfProof.to_json())

# convert the object into a dict
boost_send_request_template_credential_any_of_proof_dict = boost_send_request_template_credential_any_of_proof_instance.to_dict()
# create an instance of BoostSendRequestTemplateCredentialAnyOfProof from a dict
boost_send_request_template_credential_any_of_proof_from_dict = BoostSendRequestTemplateCredentialAnyOfProof.from_dict(boost_send_request_template_credential_any_of_proof_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


