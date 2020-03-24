"""
This XBlock is kinda simulation of robot
doing self-moving stuff according to algorithm
"""

import pkg_resources
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Integer, Scope


class RobbotXBlock(XBlock):

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        The primary view of the RobbotXBlock, shown to students
        when viewing courses.
        """
        html = self.resource_string("static/html/robbot.html")
        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string("static/css/robbot.css"))
        frag.add_javascript(self.resource_string("static/js/src/robbot.js"))
        frag.initialize_js('RobbotXBlock')
        return frag

    # TO-DO: change this handler to perform your own actions.  You may need more
    # than one handler, or you may not need any handlers at all.
    @XBlock.json_handler
    def test(self, data, suffix=''):
        return 'zbs'

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("RobbotXBlock",
             """<robbot/>
             """),
            ("Multiple RobbotXBlock",
             """<vertical_demo>
                <robbot/>
                <robbot/>
                <robbot/>
                </vertical_demo>
             """),
        ]
