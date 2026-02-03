# BoostSendRequestTemplate


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** |  | [optional] 
**type** | **str** |  | [optional] 
**category** | **str** |  | [optional] 
**status** | **str** |  | [optional] 
**auto_connect_recipients** | **bool** |  | [optional] 
**meta** | **Dict[str, object]** |  | [optional] 
**default_permissions** | [**BoostSendRequestTemplateDefaultPermissions**](BoostSendRequestTemplateDefaultPermissions.md) |  | [optional] 
**allow_anyone_to_create_children** | **bool** |  | [optional] 
**credential** | [**BoostSendRequestTemplateCredential**](BoostSendRequestTemplateCredential.md) |  | 
**claim_permissions** | [**BoostSendRequestTemplateClaimPermissions**](BoostSendRequestTemplateClaimPermissions.md) |  | [optional] 
**skills** | [**List[BoostSendRequestTemplateSkillsInner]**](BoostSendRequestTemplateSkillsInner.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_send_request_template import BoostSendRequestTemplate

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendRequestTemplate from a JSON string
boost_send_request_template_instance = BoostSendRequestTemplate.from_json(json)
# print the JSON string representation of the object
print(BoostSendRequestTemplate.to_json())

# convert the object into a dict
boost_send_request_template_dict = boost_send_request_template_instance.to_dict()
# create an instance of BoostSendRequestTemplate from a dict
boost_send_request_template_from_dict = BoostSendRequestTemplate.from_dict(boost_send_request_template_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


