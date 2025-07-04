# coding: utf-8

"""
    LearnCloud Network API

    API for interacting with LearnCloud Network

    The version of the OpenAPI document: 1.0.0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


from __future__ import annotations
import pprint
import re  # noqa: F401
import json

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictStr
from typing import Any, ClassVar, Dict, List, Optional
from typing import Optional, Set
from typing_extensions import Self

class BoostCreateBoostRequestClaimPermissions(BaseModel):
    """
    BoostCreateBoostRequestClaimPermissions
    """ # noqa: E501
    role: Optional[StrictStr] = None
    can_edit: Optional[StrictBool] = Field(default=None, alias="canEdit")
    can_issue: Optional[StrictBool] = Field(default=None, alias="canIssue")
    can_revoke: Optional[StrictBool] = Field(default=None, alias="canRevoke")
    can_manage_permissions: Optional[StrictBool] = Field(default=None, alias="canManagePermissions")
    can_issue_children: Optional[StrictStr] = Field(default=None, alias="canIssueChildren")
    can_create_children: Optional[StrictStr] = Field(default=None, alias="canCreateChildren")
    can_edit_children: Optional[StrictStr] = Field(default=None, alias="canEditChildren")
    can_revoke_children: Optional[StrictStr] = Field(default=None, alias="canRevokeChildren")
    can_manage_children_permissions: Optional[StrictStr] = Field(default=None, alias="canManageChildrenPermissions")
    can_manage_children_profiles: Optional[StrictBool] = Field(default=False, alias="canManageChildrenProfiles")
    can_view_analytics: Optional[StrictBool] = Field(default=None, alias="canViewAnalytics")
    __properties: ClassVar[List[str]] = ["role", "canEdit", "canIssue", "canRevoke", "canManagePermissions", "canIssueChildren", "canCreateChildren", "canEditChildren", "canRevokeChildren", "canManageChildrenPermissions", "canManageChildrenProfiles", "canViewAnalytics"]

    model_config = ConfigDict(
        populate_by_name=True,
        validate_assignment=True,
        protected_namespaces=(),
    )


    def to_str(self) -> str:
        """Returns the string representation of the model using alias"""
        return pprint.pformat(self.model_dump(by_alias=True))

    def to_json(self) -> str:
        """Returns the JSON representation of the model using alias"""
        # TODO: pydantic v2: use .model_dump_json(by_alias=True, exclude_unset=True) instead
        return json.dumps(self.to_dict())

    @classmethod
    def from_json(cls, json_str: str) -> Optional[Self]:
        """Create an instance of BoostCreateBoostRequestClaimPermissions from a JSON string"""
        return cls.from_dict(json.loads(json_str))

    def to_dict(self) -> Dict[str, Any]:
        """Return the dictionary representation of the model using alias.

        This has the following differences from calling pydantic's
        `self.model_dump(by_alias=True)`:

        * `None` is only added to the output dict for nullable fields that
          were set at model initialization. Other fields with value `None`
          are ignored.
        """
        excluded_fields: Set[str] = set([
        ])

        _dict = self.model_dump(
            by_alias=True,
            exclude=excluded_fields,
            exclude_none=True,
        )
        return _dict

    @classmethod
    def from_dict(cls, obj: Optional[Dict[str, Any]]) -> Optional[Self]:
        """Create an instance of BoostCreateBoostRequestClaimPermissions from a dict"""
        if obj is None:
            return None

        if not isinstance(obj, dict):
            return cls.model_validate(obj)

        _obj = cls.model_validate({
            "role": obj.get("role"),
            "canEdit": obj.get("canEdit"),
            "canIssue": obj.get("canIssue"),
            "canRevoke": obj.get("canRevoke"),
            "canManagePermissions": obj.get("canManagePermissions"),
            "canIssueChildren": obj.get("canIssueChildren"),
            "canCreateChildren": obj.get("canCreateChildren"),
            "canEditChildren": obj.get("canEditChildren"),
            "canRevokeChildren": obj.get("canRevokeChildren"),
            "canManageChildrenPermissions": obj.get("canManageChildrenPermissions"),
            "canManageChildrenProfiles": obj.get("canManageChildrenProfiles") if obj.get("canManageChildrenProfiles") is not None else False,
            "canViewAnalytics": obj.get("canViewAnalytics")
        })
        return _obj


