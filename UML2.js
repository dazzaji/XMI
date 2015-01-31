/*
 * Copyright (c) 2014 MKLab. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, browser: true, sub:true */
/*global $, _, define, app, type, DOMParser */

define(function (require, exports, module) {
    "use strict";

    var IdGenerator      = app.getModule("core/IdGenerator"),
        MetaModelManager = app.getModule("core/MetaModelManager"),
        UML              = app.getModule("uml/UML");

    var Reader = require("XMI21Reader");

    function addTo(json, field, element) {
        if (!Array.isArray(json[field])) {
            json[field] = [];
        }
        var arr = json[field];
        if (element) {
            arr.push(element);
        }
    }

    function appendTo(json, field, elements) {
        if (!Array.isArray(json[field])) {
            json[field] = [];
        }
        var arr = json[field];
        _.each(elements, function (elem) {
            if (!_.contains(arr, elem)) {
                arr.push(elem);
            }
        });
    }

    // Enumerations ............................................................

    Reader.enumerations["uml:AggregationKind"] = {
        "none"      : UML.AK_NONE,
        "shared"    : UML.AK_SHARED,
        "composite" : UML.AK_COMPOSITE
    };

    Reader.enumerations["uml:VisibilityKind"] = {
        "public"    : UML.VK_PUBLIC,
        "protected" : UML.VK_PROTECTED,
        "private"   : UML.VK_PRIVATE,
        "package"   : UML.VK_PACKAGE
    };

    Reader.enumerations["uml:ParameterDirectionKind"] = {
        "in"     : UML.DK_IN,
        "inout"  : UML.DK_INOUT,
        "out"    : UML.DK_OUT,
        "return" : UML.DK_RETURN
    };

    Reader.enumerations["uml:InteractionOperatorKind"] = {
        "alt"      : UML.IOK_ALT,
        "opt"      : UML.IOK_OPT,
        "par"      : UML.IOK_PAR,
        "loop"     : UML.IOK_LOOP,
        "critical" : UML.IOK_CRITICAL,
        "neg"      : UML.IOK_NEG,
        "assert"   : UML.IOK_ASSERT,
        "strict"   : UML.IOK_STRICT,
        "seq"      : UML.IOK_SEQ,
        "ignore"   : UML.IOK_IGNORE,
        "consider" : UML.IOK_CONSIDER,
        "break"    : UML.IOK_BREAK
    };

    // Kernel ..................................................................

    Reader.elements["uml:Element"] = function (node) {
        var json = { tags: [] };
        json["_id"] = Reader.readString(node, "xmi:id", IdGenerator.generateGuid());
        return json;
    };

    Reader.elements["uml:Relationship"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        return json;
    };

    Reader.elements["uml:DirectedRelationship"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        return json;
    };

    // Expressions .............................................................

    Reader.elements["uml:ValueSpecification"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        return json;
    };

    Reader.elements["uml:LiteralSpecification"] = function (node) {
        var json = Reader.elements["uml:ValueSpecification"](node);
        return json;
    };

    Reader.elements["uml:LiteralBoolean"] = function (node) {
        var json = Reader.elements["uml:LiteralSpecification"](node);
        var val = Reader.readBoolean(node, "value", false);
        return val;
    };

    Reader.elements["uml:LiteralInteger"] = function (node) {
        var json = Reader.elements["uml:LiteralSpecification"](node);
        var val = Reader.readInteger(node, "value", 0);
        return val;
    };

    Reader.elements["uml:LiteralString"] = function (node) {
        var json = Reader.elements["uml:LiteralSpecification"](node);
        var val = Reader.readString(node, "value", "");
        return val;
    };

    Reader.elements["uml:LiteralUnlimitedNatural"] = function (node) {
        var json = Reader.elements["uml:LiteralSpecification"](node);
        var val = Reader.readString(node, "value", "");
        if (val === "-1") { // for EA
            val = "*";
        }
        return val;
    };

    Reader.elements["uml:LiteralNull"] = function (node) {
        var json = Reader.elements["uml:LiteralSpecification"](node);
        return null;
    };

    Reader.elements["uml:OpaqueExpression"] = function (node) {
        var json = Reader.elements["uml:ValueSpecification"](node);
        var val = Reader.readString(node, "body", "");
        return val;
    };


    // Core ....................................................................

    Reader.elements["uml:MultiplicityElement"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        json["isOrdered"] = Reader.readBoolean(node, "isOrdered", false);
        json["isUnique"] = Reader.readBoolean(node, "isUnique", false);
        var lowerValue = Reader.readElement(node, "lowerValue");
        var upperValue = Reader.readElement(node, "upperValue");
        if (lowerValue !== null && upperValue !== null) {
            json["multiplicity"] = lowerValue + ".." + upperValue;
        } else if (lowerValue !== null) {
            json["multiplicity"] = lowerValue;
        } else if (upperValue !== null) {
            json["multiplicity"] = upperValue;
        }
        if (json["multiplicity"] === "*..*") { // for EA
            json["multiplicity"] = "*";
        }
        if (json["multiplicity"] === "1..1" || json["multiplicity"] === "0..0") { // for EA
            json["multiplicity"] = "";
        }
        return json;
    };

    Reader.elements["uml:NamedElement"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        json["name"] = Reader.readString(node, "name", "");
        json["visibility"] = Reader.readEnum(node, "visibility", "uml:VisibilityKind", UML.VK_PUBLIC);
        return json;
    };

    Reader.elements["uml:PackageableElement"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        return json;
    };

    Reader.elements["uml:Namespace"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        appendTo(json, "ownedElements", Reader.readElementArray(node, "ownedMember"));
        return json;
    };

    Reader.elements["uml:Package"] = function (node) {
        var json = Reader.elements["uml:Namespace"](node);
        _.extend(json, Reader.elements["uml:PackageableElement"](node));
        json["_type"] = "UMLPackage";
        appendTo(json, "ownedElements", Reader.readElementArray(node, "packagedElement"));
        // TODO: ownedType
        // TODO: nestedPackage
        return json;
    };

    Reader.elements["uml:Model"] = function (node) {
        var json = Reader.elements["uml:Package"](node);
        json["_type"] = "UMLModel";
        return json;
    };

    Reader.elements["uml:TypedElement"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        json["type"] = Reader.readRef(node, "type");
        // TODO: read type for EA
        return json;
    };

    Reader.elements["uml:RedefinableElement"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        json["isLeaf"] = Reader.readBoolean(node, "isLeaf", false);
        return json;
    };

    Reader.elements["uml:ConnectableElement"] = function (node) {
        var json = Reader.elements["uml:TypedElement"](node);
        return json;
    };

    // Features ................................................................

    Reader.elements["uml:Feature"] = function (node) {
        var json = Reader.elements["uml:RedefinableElement"](node);
        json["isStatic"] = Reader.readBoolean(node, "isStatic", false);
        return json;
    };

    Reader.elements["uml:StructuralFeature"] = function (node) {
        var json = Reader.elements["uml:Feature"](node);
        _.extend(json, Reader.elements["uml:TypedElement"](node));
        _.extend(json, Reader.elements["uml:MultiplicityElement"](node));
        json["isReadOnly"] = Reader.readBoolean(node, "isReadOnly", false);
        return json;
    };

    Reader.elements["uml:Property"] = function (node) {
        var json = Reader.elements["uml:StructuralFeature"](node);
        _.extend(json, Reader.elements["uml:ConnectableElement"](node));
        json["_type"] = "UMLAttribute";
        json["isDerived"] = Reader.readBoolean(node, "isDerived", false);
        // isDerivedUnion
        json["aggregation"] = Reader.readEnum(node, "aggregation", "uml:AggregationKind", UML.AK_NONE);
        json["defaultValue"] = Reader.readElement(node, "defaultValue") || "";
        // Read as an AssociationEnd
        json["navigable"] = Reader.readBoolean(node, "isNavigable", false);
        json["qualifiers"] = Reader.readElementArray(node, "qualifier") || [];
        return json;
    };

    Reader.elements["uml:Parameter"] = function (node) {
        var json = Reader.elements["uml:TypedElement"](node);
        _.extend(json, Reader.elements["uml:MultiplicityElement"](node));
        json["_type"] = "UMLParameter";
        json["defaultValue"] = Reader.readElement(node, "defaultValue") || "";
        json["direction"] =
            Reader.readEnum(node, "direction", "uml:ParameterDirectionKind") ||
            Reader.readEnum(node, "kind", "uml:ParameterDirectionKind") ||
            UML.DK_IN;
        return json;
    };

    Reader.elements["uml:BehavioralFeature"] = function (node) {
        var json = Reader.elements["uml:Feature"](node);
        _.extend(json, Reader.elements["uml:Namespace"](node));
        json["parameters"] = Reader.readElementArray(node, "ownedParameter", "uml:Parameter");
        return json;
    };

    Reader.elements["uml:Operation"] = function (node) {
        var json = Reader.elements["uml:BehavioralFeature"](node);
        json["_type"] = "UMLOperation";
        json["isQuery"] = Reader.readBoolean(node, "isQuery", false);
        json["isAbstract"] = Reader.readBoolean(node, "isAbstract", false);
        return json;
    };

    // Templates ...............................................................

    Reader.elements["uml:TemplateableElement"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        var ts = Reader.readElement(node, "ownedTemplateSignature");
        json["templateParameters"] = ts ? ts["__ownedParameter"] : [];
        return json;
    };

    Reader.elements["uml:ParameterableElement"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        return json;
    };

    Reader.elements["uml:TemplateSignature"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        json["__ownedParameter"] = Reader.readElementArray(node, "ownedParameter");
        return json;
    };

    Reader.elements["uml:RedefinableTemplateSignature"] = function (node) {
        var json = Reader.elements["uml:TemplateSignature"](node);
        _.extend(json, Reader.elements["uml:RedefinableElement"](node));
        return json;
    };

    Reader.elements["uml:TemplateParameter"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        json["_type"] = "UMLTemplateParameter";
        var pe = Reader.readElement(node, "ownedParameteredElement");
        json["name"] =
            (pe ? pe.name : null) ||
            Reader.readString(node, "name") ||
            "";
        json["defaultValue"] =
            Reader.readElement(node, "defaultValue") || // for VP
            "";
        // TODO: defaultValue for EA
        // TODO: parameterType
        return json;
    };

    Reader.elements["uml:ClassifierTemplateParameter"] = function (node) {
        var json = Reader.elements["uml:TemplateParameter"](node);
        return json;
    };


    // Instances ...............................................................

    Reader.elements["uml:InstanceSpecification"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        json["specification"] = Reader.readElement(node, "specification");
        json["_type"] = "UMLObject";
        json["classifier"] = Reader.readRef(node, "classifier");
        json["slots"] = Reader.readElementArray(node, "slot");
        // TODO: Link is represented as InstanceSpecification with extensions in VP
        return json;
    };

    Reader.elements["uml:Slot"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        json["_type"] = "UMLSlot";
        json["value"] = Reader.readElement(node, "value") || "";
        json["definingFeature"] = Reader.readRef(node, "definingFeature");
        return json;
    };

    // Types ...................................................................

    Reader.elements["uml:Type"] = function (node) {
        var json = Reader.elements["uml:PackageableElement"](node);
        return json;
    };

    Reader.elements["uml:Classifier"] = function (node) {
        var json = Reader.elements["uml:Namespace"](node);
        _.extend(json, Reader.elements["uml:RedefinableElement"](node));
        _.extend(json, Reader.elements["uml:Type"](node));
        _.extend(json, Reader.elements["uml:TemplateableElement"](node));
        _.extend(json, Reader.elements["uml:ParameterableElement"](node));
        json["isAbstract"] = Reader.readBoolean(node, "isAbstract", false);
        json["attributes"] = Reader.readElementArray(node, "ownedAttribute", "uml:Property");
        json["operations"] = Reader.readElementArray(node, "ownedOperation", "uml:Operation");
        var _generalizations = Reader.readElementArray(node, "generalization");
        _.each(_generalizations, function (g) {
            g["source"] = { "$ref": json._id };
            addTo(json, "ownedElements", g);
        });
        appendTo(json, "ownedElements", Reader.readElementArray(node, "collaborationUse"));
        appendTo(json, "ownedElements", Reader.readElementArray(node, "nestedClassifier"));
        return json;
    };

    Reader.elements["uml:StructuredClassifier"] = function (node) {
        var json = Reader.elements["uml:Classifier"](node);
        appendTo(json, "ownedElements", Reader.readElementArray(node, "ownedConnector"));
        return json;
    };

    Reader.elements["uml:EncapsulatedClassifier"] = function (node) {
        var json = Reader.elements["uml:StructuredClassifier"](node);
        appendTo(json, "attributes", Reader.readElementArray(node, "ownedPort"));
        return json;
    };

    Reader.elements["uml:BehavioredClassifier"] = function (node) {
        var json = Reader.elements["uml:Classifier"](node);
        json["behaviors"] = Reader.readElementArray(node, "ownedBehavior");
        return json;
    };

    Reader.elements["uml:Class"] = function (node) {
        var json = Reader.elements["uml:Classifier"](node);
        _.extend(json, Reader.elements["uml:EncapsulatedClassifier"](node));
        _.extend(json, Reader.elements["uml:BehavioredClassifier"](node));
        json["_type"] = "UMLClass";
        return json;
    };

    Reader.elements["uml:Interface"] = function (node) {
        var json = Reader.elements["uml:Classifier"](node);
        json["_type"] = "UMLInterface";
        return json;
    };

    Reader.elements["uml:DataType"] = function (node) {
        var json = Reader.elements["uml:Classifier"](node);
        json["_type"] = "UMLDataType";
        return json;
    };

    Reader.elements["uml:PrimitiveType"] = function (node) {
        var json = Reader.elements["uml:DataType"](node);
        json["_type"] = "UMLPrimitiveType";
        return json;
    };

    Reader.elements["uml:EnumerationLiteral"] = function (node) {
        var json = Reader.elements["uml:InstanceSpecification"](node);
        json["_type"] = "UMLEnumerationLiteral";
        return json;
    };

    Reader.elements["uml:Enumeration"] = function (node) {
        var json = Reader.elements["uml:DataType"](node);
        json["_type"] = "UMLEnumeration";
        json["literals"] = Reader.readElementArray(node, "ownedLiteral");
        return json;
    };

    Reader.elements["uml:Generalization"] = function (node) {
        var json = Reader.elements["uml:DirectedRelationship"](node);
        json["_type"] = "UMLGeneralization";
        json["target"] = Reader.readRef(node, "general");
        return json;
    };

    Reader.elements["uml:Dependency"] = function (node) {
        var json = Reader.elements["uml:DirectedRelationship"](node);
        _.extend(json, Reader.elements["uml:PackageableElement"](node));
        json["_type"] = "UMLDependency";
        json["source"] = Reader.readRef(node, "client");
        json["target"] = Reader.readRef(node, "supplier");
        return json;
    };

    Reader.elements["uml:Abstraction"] = function (node) {
        var json = Reader.elements["uml:Dependency"](node);
        json["_type"] = "UMLAbstraction";
        return json;
    };

    Reader.elements["uml:Usage"] = function (node) {
        var json = Reader.elements["uml:Dependency"](node);
        json["_type"] = "UMLDependency";
        json["stereotype"] = "use";
        return json;
    };

    Reader.elements["uml:Realization"] = function (node) {
        var json = Reader.elements["uml:Abstraction"](node);
        json["_type"] = "UMLRealization";
        return json;
    };

    Reader.elements["uml:InterfaceRealization"] = function (node) {
        var json = Reader.elements["uml:Realization"](node);
        json["_type"] = "UMLInterfaceRealization";
        return json;
    };

    Reader.elements["uml:Association"] = function (node) {
        var json = Reader.elements["uml:Relationship"](node);
        _.extend(json, Reader.elements["uml:Classifier"](node));
        json["_type"] = "UMLAssociation";
        var _ends    = Reader.readElementArray(node, "ownedEnd"),
            _endRefs = Reader.readRefArray(node, "memberEnd");
        if (_ends && _ends.length >= 2) {
            _ends[0]._type = "UMLAssociationEnd";
            _ends[1]._type = "UMLAssociationEnd";
            _ends[0].reference = _ends[0].type;
            _ends[1].reference = _ends[1].type;
            var _agg = _ends[0].aggregation;
            _ends[0].aggregation = _ends[1].aggregation;
            _ends[1].aggregation = _agg;
            json["end1"] = _ends[0];
            json["end2"] = _ends[1];
        } else if (_ends && _ends.length === 1) {
            _ends[0]._type = "UMLAssociationEnd";
            _ends[0].reference = _ends[0].type;
            json["end1"] = _ends[0];
            if (_endRefs && _endRefs.length > 0) {
                json["end2"] = _endRefs[0];
            }
        } else {
            if (_endRefs && _endRefs.length >= 2) {
                json["end1"] = _endRefs[0];
                json["end2"] = _endRefs[1];
            }
        }
        return json;
    };

    Reader.elements["uml:AssociationClass"] = function (node) {
        // Read for Class
        var jsonClass = Reader.elements["uml:Class"](node);
        jsonClass["_type"] = "UMLClass";
        // Read for Association
        var jsonAsso = Reader.elements["uml:Association"](node);
        jsonAsso["_type"] = "UMLAssociation";
        jsonAsso["_id"] = IdGenerator.generateGuid();
        jsonAsso["_parent"] = { "$ref": jsonClass._id };
        if (jsonAsso.end1) {
            jsonAsso.end1._parent = { "$ref": jsonAsso._id };
        }
        if (jsonAsso.end2) {
            jsonAsso.end2._parent = { "$ref": jsonAsso._id };
        }
        Reader.put(jsonAsso);
        // Object for AssociationClassLink
        var jsonLink = {
            _id: IdGenerator.generateGuid(),
            _type: "UMLAssociationClassLink",
            _parent: { "$ref": jsonClass._id },
            associationSide: { "$ref": jsonAsso._id },
            classSide: { "$ref": jsonClass._id }
        };
        Reader.put(jsonLink);
        // Add Asso and Link to Class.
        jsonClass.__association = jsonAsso;
        jsonClass.__link = jsonLink;
        addTo(jsonClass, "ownedElements", jsonAsso);
        addTo(jsonClass, "ownedElements", jsonLink);
        return jsonClass;
    };

    // Composite Structure .....................................................

    Reader.elements["uml:ConnectorEnd"] = function (node) {
        var json = Reader.elements["uml:MultiplicityElement"](node);
        json["_type"] = "UMLConnectorEnd";
        json["reference"] = Reader.readRef(node, "role");
        return json;
    };

    Reader.elements["uml:Connector"] = function (node) {
        var json = Reader.elements["uml:Feature"](node);
        json["_type"] = "UMLConnector";
        var _ends = Reader.readElementArray(node, "end");
        if (_ends && _ends.length >= 2) {
            json["end1"] = _ends[0];
            json["end2"] = _ends[1];
        }
        return json;
    };

    Reader.elements["uml:Port"] = function (node) {
        var json = Reader.elements["uml:Property"](node);
        json["_type"] = "UMLPort";
        json["isBehavior"] = Reader.readBoolean(node, "isBehavior", false);
        json["isService"] = Reader.readBoolean(node, "isService", false);
        return json;
    };

    Reader.elements["uml:Collaboration"] = function (node) {
        var json = Reader.elements["uml:BehavioredClassifier"](node);
        json["_type"] = "UMLCollaboration";
        return json;
    };

    Reader.elements["uml:CollaborationUse"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        json["_type"] = "UMLCollaborationUse";
        json["type"] = Reader.readRef(node, "type");
        return json;
    };
    Reader.elements["collaborationOccurrence"] = Reader.elements["uml:CollaborationUse"]; // for VP

    // Components ..............................................................

    Reader.elements["uml:Component"] = function (node) {
        var json = Reader.elements["uml:Class"](node);
        json["_type"] = "UMLComponent";
        json["isIndirectlyInstantiated"] = Reader.readBoolean(node, "isIndirectlyInstantiated", false);
        return json;
    };

    Reader.elements["uml:ComponentRealization"] = function (node) {
        var json = Reader.elements["uml:Realization"](node);
        json["_type"] = "UMLComponentRealization";
        return json;
    };

    // Deployments .............................................................

    Reader.elements["uml:DeploymentTarget"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        appendTo(json, "ownedElements", Reader.readElementArray(node, "deployment"));
        return json;
    };

    Reader.elements["uml:DeployedArtifact"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        return json;
    };

    Reader.elements["uml:Artifact"] = function (node) {
        var json = Reader.elements["uml:Classifier"](node);
        _.extend(json, Reader.elements["uml:DeployedArtifact"](node));
        json["_type"] = "UMLArtifact";
        json["fileName"] = Reader.readString(node, "fileName", "");
        return json;
    };

    Reader.elements["uml:Node"] = function (node) {
        var json = Reader.elements["uml:Class"](node);
        _.extend(json, Reader.elements["uml:DeploymentTarget"](node));
        json["_type"] = "UMLNode";
        return json;
    };

    Reader.elements["uml:CommunicationPath"] = function (node) {
        var json = Reader.elements["uml:Association"](node);
        json["_type"] = "UMLCommunicationPath";
        return json;
    };

    Reader.elements["uml:Device"] = function (node) {
        var json = Reader.elements["uml:Node"](node);
        json["_type"] = "UMLNode";
        json["stereotype"] = "device";
        return json;
    };

    Reader.elements["uml:ExecutionEnvironment"] = function (node) {
        var json = Reader.elements["uml:Node"](node);
        json["_type"] = "UMLNode";
        json["stereotype"] = "executionEnvironment";
        return json;
    };

    Reader.elements["uml:Deployment"] = function (node) {
        var json = Reader.elements["uml:Dependency"](node);
        json["_type"] = "UMLDeployment";
        return json;
    };

    // Use Case ................................................................

    Reader.elements["uml:ExtensionPoint"] = function (node) {
        var json = Reader.elements["uml:RedefinableElement"](node);
        json["_type"] = "UMLExtensionPoint";
        return json;
    };

    Reader.elements["uml:Actor"] = function (node) {
        var json = Reader.elements["uml:BehavioredClassifier"](node);
        json["_type"] = "UMLActor";
        return json;
    };

    Reader.elements["uml:UseCase"] = function (node) {
        var json = Reader.elements["uml:BehavioredClassifier"](node);
        json["_type"] = "UMLUseCase";
        json["extensionPoints"] = Reader.readElementArray(node, "extensionPoint");
        var _includes = Reader.readElementArray(node, "include");
        _.each(_includes, function (g) {
            g["source"] = { "$ref": json._id };
            addTo(json, "ownedElements", g);
        });
        var _extends = Reader.readElementArray(node, "extend");
        _.each(_extends, function (g) {
            g["source"] = { "$ref": json._id };
            addTo(json, "ownedElements", g);
        });
        return json;
    };

    Reader.elements["uml:Extend"] = function (node) {
        var json = Reader.elements["uml:DirectedRelationship"](node);
        _.extend(json, Reader.elements["uml:NamedElement"](node));
        json["_type"] = "UMLExtend";
        json["target"] = Reader.readRef(node, "extendedCase");
        addTo(json, "extensionLocations", Reader.readRef(node, "extensionLocation"));
        return json;
    };

    Reader.elements["uml:Include"] = function (node) {
        var json = Reader.elements["uml:DirectedRelationship"](node);
        _.extend(json, Reader.elements["uml:NamedElement"](node));
        json["_type"] = "UMLInclude";
        json["target"] = Reader.readRef(node, "addition");
        return json;
    };

    // Profiles ................................................................

    Reader.elements["uml:Profile"] = function (node) {
        var json = Reader.elements["uml:Package"](node);
        json["_type"] = "UMLProfile";
        return json;
    };

    Reader.elements["uml:Stereotype"] = function (node) {
        var json = Reader.elements["uml:Class"](node);
        json["_type"] = "UMLStereotype";
        return json;
    };


    // Common Behavior .........................................................

    Reader.elements["uml:Event"] = function (node) {
        var json = Reader.elements["uml:PackageableElement"](node);
        return json;
    };

    Reader.elements["uml:MessageEvent"] = function (node) {
        var json = Reader.elements["uml:Event"](node);
        return json;
    };

    Reader.elements["uml:TimeEvent"] = function (node) {
        var json = Reader.elements["uml:Event"](node);
        return json;
    };

    Reader.elements["uml:ChangeEvent"] = function (node) {
        var json = Reader.elements["uml:Event"](node);
        return json;
    };

    Reader.elements["uml:Action"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        json["_type"] = "UMLAction";
        return json;
    };

    Reader.elements["uml:InvocationAction"] = function (node) {
        var json = Reader.elements["uml:Action"](node);
        return json;
    };

    Reader.elements["uml:CallAction"] = function (node) {
        var json = Reader.elements["uml:InvocationAction"](node);
        return json;
    };

    Reader.elements["uml:CallBehaviorAction"] = function (node) {
        var json = Reader.elements["uml:CallAction"](node);
        json["_type"] = "UMLCallBehaviorAction";
        json["behavior"] = Reader.readRef(node, "behavior");
        return json;
    };

    Reader.elements["uml:CallOperationAction"] = function (node) {
        var json = Reader.elements["uml:CallAction"](node);
        json["_type"] = "UMLCallOperationAction";
        json["operation"] = Reader.readRef(node, "operation");
        return json;
    };

    Reader.elements["uml:SendSignalAction"] = function (node) {
        var json = Reader.elements["uml:InvocationAction"](node);
        json["_type"] = "UMLSendSignalAction";
        json["signal"] = Reader.readRef(node, "signal");
        return json;
    };

    // Interactions ............................................................

    Reader.elements["uml:Behavior"] = function (node) {
        var json = Reader.elements["uml:Class"](node);
        json["isReentrant"] = Reader.readBoolean(node, "isReentrant", false);
        return json;
    };

    Reader.elements["uml:InteractionFragment"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        return json;
    };

    Reader.elements["uml:Interaction"] = function (node) {
        var json = Reader.elements["uml:InteractionFragment"](node);
        _.extend(json, Reader.elements["uml:Behavior"](node));
        json["_type"] = "UMLInteraction";
        json["fragments"] = Reader.readElementArray(node, "fragment");
        json["participants"] = Reader.readElementArray(node, "lifeline");
        json["messages"] = Reader.readElementArray(node, "message");
        return json;
    };

    Reader.elements["uml:StateInvariant"] = function (node) {
        var json = Reader.elements["uml:InteractionFragment"](node);
        json["_type"] = "UMLStateInvariant";
        return json;
    };

    Reader.elements["uml:OccurrenceSpecification"] = function (node) {
        var json = Reader.elements["uml:InteractionFragment"](node);
        return json;
    };

    // NOTE: EventOccurrence is only for VP (not in UML Spec)
    Reader.elements["uml:EventOccurrence"] = function (node) {
        var json = Reader.elements["uml:OccurrenceSpecification"](node);
        json["_type"] = "EventOccurrence";
        json["covered"] = Reader.readRef(node, "covered");
        json["message"] = Reader.readRef(node, "message");
        return json;
    };

    Reader.elements["uml:CombinedFragment"] = function (node) {
        var json = Reader.elements["uml:InteractionFragment"](node);
        json["_type"] = "UMLCombinedFragment";
        json["interactionOperator"] = Reader.readEnum(node, "interactionOperator", "uml:InteractionOperatorKind", UML.IOK_SEQ);
        json["operands"] = Reader.readElementArray(node, "ownedMember");
        return json;
    };

    Reader.elements["uml:InteractionOperand"] = function (node) {
        var json = Reader.elements["uml:InteractionFragment"](node);
        json["_type"] = "UMLInteractionOperand";
        return json;
    };

    Reader.elements["uml:Lifeline"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        json["_type"] = "UMLLifeline";
        json["represent"] = Reader.readRef(node, "represents");
        return json;
    };

    Reader.elements["uml:Message"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        json["_type"] = "UMLMessage";
        json["receiveEvent"] = Reader.readRef(node, "receiveEvent");
        json["sendEvent"] = Reader.readRef(node, "sendEvent");
        json["connector"] = Reader.readRef(node, "connector");
        var _signature = Reader.readElement(node, "signature");
        if (_signature && _signature._type === "UMLCallOperationAction") {
            json["signature"] = _signature.operation;
        }
        if (_signature && _signature._type === "UMLSendSignalAction") {
            json["signature"] = _signature.signal;
        }
        return json;
    };

    // TODO: InteractionUse
    // TODO: Continuation
    // TODO: StateInvariant
    // TODO: Gate
    // TODO: Constraint
    // TODO: EA Test

    // Post-processors .........................................................

    // process ComponentRealization
    Reader.postprocessors.push(function (elem) {
        if (elem._type === "UMLRealization") {
            var source = Reader.get(elem.source.$ref),
                target = Reader.get(elem.target.$ref);
            if (MetaModelManager.isKindOf(target._type, "UMLComponent")) {
                elem._type = "UMLComponentRealization";
            }
            if (MetaModelManager.isKindOf(target._type, "UMLInterface")) {
                elem._type = "UMLInterfaceRealization";
            }
        }
    });

    // process 'memberEnd' of Association
    Reader.postprocessors.push(function (elem) {
        if (elem._type === "UMLAssociation") {
            if (elem.end1 && elem.end1.$ref) {
                elem.end1 = Reader.get(elem.end1.$ref);
                var parent1 = Reader.get(elem.end1._parent.$ref);
                parent1.attributes = _.without(parent1.attributes, elem.end1);
                elem.end1._type = "UMLAssociationEnd";
                elem.end1._parent = { "$ref": elem._id };
                elem.end1.navigable = false;
                elem.end1.reference = elem.end1.type;
            }
            if (elem.end2 && elem.end2.$ref) {
                elem.end2 = Reader.get(elem.end2.$ref);
                var parent2 = Reader.get(elem.end2._parent.$ref);
                parent2.attributes = _.without(parent2.attributes, elem.end2);
                elem.end2._type = "UMLAssociationEnd";
                elem.end2._parent = { "$ref": elem._id };
                elem.end2.navigable = false;
                elem.end2.reference = elem.end2.type;
            }
        }
    });

    // process RoleBindings of CollaborationUse
    // TODO: RoleBindings are not properly loaded of Visual Paradigm XMI
    Reader.postprocessors.push(function (elem) {
        if (elem._type === "UMLDependency") {
            var e1, e2;
            if (elem.source.$ref) {
                e1 = Reader.get(elem.source.$ref);
            }
            if (elem.target.$ref) {
                e2 = Reader.get(elem.target.$ref);
            }
            if (e1 && e2) {
                if ((MetaModelManager.isKindOf(e1._type, "UMLCollaborationUse") &&
                    (MetaModelManager.isKindOf(e2._type, "UMLAttribute"))) ||
                    (MetaModelManager.isKindOf(e1._type, "UMLCollaborationUse") &&
                    (MetaModelManager.isKindOf(e2._type, "UMLAttribute")))) {
                    elem._type = "UMLRoleBinding";
                }
            }
        }
    });

    // process Deployment
    Reader.postprocessors.push(function (elem) {
        if (elem._type === "UMLDeployment") {
            var _temp = elem.source;
            elem.source = elem.target;
            elem.target = _temp;
        }
    });

    // process InstanceSpecification
    Reader.postprocessors.push(function (elem) {
        if (elem._type === "UMLObject" && elem.classifier) {
            var _classifier = Reader.get(elem.classifier.$ref);
            if (_classifier._type === "UMLNode") {
                elem._type = "UMLNodeInstance";
            } else if (_classifier._type === "UMLComponent") {
                elem._type = "UMLComponentInstance";
            } else if (_classifier._type === "UMLArtifact") {
                elem._type = "UMLArtifactInstance";
            }
        }
    });

    // process Slot
    Reader.postprocessors.push(function (elem) {
        if (elem._type === "UMLSlot") {
            if ((!elem.name || elem.name.trim().length === 0) && elem.definingFeature) {
                var _feature = Reader.get(elem.definingFeature.$ref);
                elem.name = _feature.name;
            }
        }
    });

    // process Extend
    Reader.postprocessors.push(function (elem) {
        if (elem._type === "UMLExtend" && elem.__extensionLocation) {
            var loc = Reader.get(elem.__extensionLocation.$ref);
            elem.location = loc.name;
        }
    });

    // process Interaction
    Reader.postprocessors.push(function (elem) {
        if (elem._type === "UMLInteraction") {
            var parent = Reader.get(elem._parent.$ref);
            if (MetaModelManager.isKindOf(parent._type, "UMLClassifier")) {
                appendTo(parent, "attributes", elem.attributes || []);
                appendTo(parent, "operations", elem.operations || []);
            } else {
                parent.ownedElements = _.without(parent.ownedElements, elem);
                var collaboration = {
                    _id: IdGenerator.generateGuid(),
                    _parent: { "$ref": parent._id },
                    _type: "UMLCollaboration",
                    ownedElements: [ elem ],
                    attributes: elem.attributes || [],
                    operations: elem.operations || []
                };
                parent.ownedElements.push(collaboration);
            }
            _.each(elem.messages, function (msg) {
                if (msg.sendEvent) {
                    var _from = Reader.get(msg.sendEvent.$ref);
                    if (_from._type === "EventOccurrence") {
                        msg.source = _from.covered;
                    }
                } else {
                    var _endpoint = {
                        _id: IdGenerator.generateGuid(),
                        _type: "UMLEndpoint",
                        _parent: { "$ref": elem._id },
                    };
                    elem.participants.push(_endpoint);
                    msg.source = { "$ref": _endpoint._id };
                }
                if (msg.receiveEvent) {
                    var _to = Reader.get(msg.receiveEvent.$ref);
                    if (_to._type === "EventOccurrence") {
                        msg.target = _to.covered;
                    }
                } else {
                    var _endpoint = {
                        _id: IdGenerator.generateGuid(),
                        _type: "UMLEndpoint",
                        _parent: { "$ref": elem._id },
                    };
                    elem.participants.push(_endpoint);
                    msg.target = { "$ref": _endpoint._id };
                }
            });
            elem.fragments = _.reject(elem.fragments, function (f) {
                return (f._type === "EventOccurrence");
            });
        }
    });

});
